import { chunk } from "@common/chunk";
import type { ReplayFilter } from "@database/filters/types";
import { FileRepository } from "@database/repositories/file_repository";
import { GameRepository } from "@database/repositories/game_repository";
import { PlayerRepository } from "@database/repositories/player_repository";
import type { Database, FileRecord, GameRecord, NewFile, NewGame, NewPlayer, PlayerRecord } from "@database/schema";
import { boolToInt, boolToIntOrNull } from "@database/utils";
import type { FileResult, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js/node";
import { SlippiGame } from "@slippi/slippi-js/node";
import { shell } from "electron";
import log from "electron-log";
import * as fs from "fs-extra";
import type { Kysely, Transaction } from "kysely";
import path from "path";

import { extractPlayerNames } from "../extract_player_names";
import { Continuation } from "./continuation";
import { inferStartTime } from "./infer_start_time";
import { mapGameRecordToFileResult } from "./record_mapper";

// Batch size for processing replays - how many insertions to be done in a single transaction
const INSERT_REPLAY_BATCH_SIZE = 500;

// SQLite has a limit of 999 parameters per query (SQLITE_MAX_VARIABLE_NUMBER)
// We use a conservative batch size to stay well under this limit for DELETE and IN operations
const SQLITE_PARAM_LIMIT_BATCH_SIZE = 500;

export class DatabaseReplayProvider implements ReplayProvider {
  private currentSearchRequestId = 0;

  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Check if a request ID has been superseded by a newer request.
   * @param requestId - The request ID to check (undefined means no tracking)
   * @returns true if the request is stale and should be cancelled
   */
  private isRequestSuperseded(requestId: number | undefined): boolean {
    return requestId !== undefined && this.currentSearchRequestId !== requestId;
  }

  public async searchReplays(
    folder: string | undefined,
    limit: number,
    continuation?: string,
    orderBy: {
      field: "lastFrame" | "startTime";
      direction?: "asc" | "desc";
    } = {
      field: "startTime",
      direction: "desc",
    },
    filters: ReplayFilter[] = [],
    onProgress?: (progress: Progress) => void,
  ): Promise<{
    files: FileResult[];
    continuation: string | undefined;
    totalCount?: number;
  }> {
    // Increment request ID for this search
    const requestId = ++this.currentSearchRequestId;
    const searchStartTime = Date.now();
    log.info(`[Request ${requestId}] Starting searchReplays for folder: ${folder ?? "all"}`);

    const maybeContinuationToken = Continuation.fromString(continuation);
    const continuationValue = maybeContinuationToken?.getValue() ?? null;
    const nextIdInclusive = maybeContinuationToken?.getNextIdInclusive() ?? null;

    // Sync the database first (add new files, remove deleted files)
    // Only sync if we're not using continuation (i.e., first page of results) and folder is specified
    if (folder !== undefined && continuationValue === null && nextIdInclusive === null) {
      // Only sync if the folder exists on disk
      if (await fs.pathExists(folder)) {
        const syncStartTime = Date.now();
        await this.syncReplayDatabase(folder, onProgress, INSERT_REPLAY_BATCH_SIZE, requestId);
        const syncDuration = Date.now() - syncStartTime;
        log.info(`[Request ${requestId}] Database sync completed in ${syncDuration}ms`);

        if (this.isRequestSuperseded(requestId)) {
          return {
            files: [],
            continuation: undefined,
            totalCount: 0,
          };
        }
      }
    }

    // Get total count on first page load (when there's no continuation)
    let totalCount: number | undefined;
    if (continuationValue === null && nextIdInclusive === null) {
      const countStartTime = Date.now();
      totalCount = await GameRepository.countGames(this.db, folder ?? null, filters);
      const countDuration = Date.now() - countStartTime;
      log.info(`[Request ${requestId}] Count query completed in ${countDuration}ms (found ${totalCount} games)`);

      if (this.isRequestSuperseded(requestId)) {
        return {
          files: [],
          continuation: undefined,
          totalCount: 0,
        };
      }
    }

    // Convert continuation value from string to proper type
    let typedContinuationValue: string | number | null = null;
    if (continuationValue !== null) {
      if (continuationValue === "null") {
        typedContinuationValue = null;
      } else if (orderBy.field === "lastFrame") {
        typedContinuationValue = parseInt(continuationValue, 10);
      } else {
        typedContinuationValue = continuationValue;
      }
    }

    // Use GameRepository.searchGames which supports filters
    const queryStartTime = Date.now();
    const records = await GameRepository.searchGames(this.db, folder ?? null, filters, {
      limit: limit + 1,
      orderBy: {
        field: orderBy.field,
        direction: orderBy.direction ?? "desc",
      },
      continuationValue: typedContinuationValue,
      nextIdInclusive: nextIdInclusive ?? undefined,
    });
    const queryDuration = Date.now() - queryStartTime;
    log.info(
      `[Request ${requestId}] Search query completed in ${queryDuration}ms (returned ${records.length} records)`,
    );

    if (this.isRequestSuperseded(requestId)) {
      return {
        files: [],
        continuation: undefined,
        totalCount: 0,
      };
    }

    const [recordsToReturn, newContinuation] = Continuation.truncate(records, limit, (record) => ({
      value: orderBy.field === "startTime" ? record.start_time ?? "null" : record.last_frame?.toString() ?? "null",
      nextIdInclusive: record._id,
    }));

    const mapStartTime = Date.now();
    const files = await this.mapGameAndFileRecordsToFileResult(recordsToReturn);
    const mapDuration = Date.now() - mapStartTime;
    log.info(`[Request ${requestId}] Player mapping completed in ${mapDuration}ms`);

    const totalDuration = Date.now() - searchStartTime;
    log.info(`[Request ${requestId}] Total searchReplays completed in ${totalDuration}ms`);

    return {
      files,
      continuation: newContinuation,
      totalCount,
    };
  }

  public async getAllFilePaths(
    folder: string | undefined,
    orderBy: {
      field: "lastFrame" | "startTime";
      direction?: "asc" | "desc";
    } = {
      field: "startTime",
      direction: "desc",
    },
    filters: ReplayFilter[] = [],
  ): Promise<string[]> {
    // Sync the database first (add new files, remove deleted files)
    // Only sync if folder is specified and exists on disk
    if (folder !== undefined && (await fs.pathExists(folder))) {
      await this.syncReplayDatabase(folder, undefined, INSERT_REPLAY_BATCH_SIZE);
    }

    // Query all file paths using the dedicated repository method
    const records = await GameRepository.getAllFilePaths(this.db, folder ?? null, filters, {
      field: orderBy.field,
      direction: orderBy.direction ?? "desc",
    });

    // Return just the full paths
    return records.map((record) => path.resolve(record.folder, record.name));
  }

  public async loadFile(filePath: string): Promise<FileResult> {
    const filename = path.basename(filePath);
    const folder = path.dirname(filePath);

    let playerRecords: PlayerRecord[];
    let gameAndFileRecord = await GameRepository.findGameByFolderAndFilename(this.db, folder, filename);

    if (gameAndFileRecord) {
      const playerMap = await PlayerRepository.findAllPlayersByGame(this.db, gameAndFileRecord._id);
      playerRecords = playerMap.get(gameAndFileRecord._id) ?? [];
    } else {
      // We haven't indexed this file before so add it to the database
      const replay = await this.insertNewReplayFile(folder, filename);
      if (!replay.gameRecord) {
        throw new Error(`Could not load game info from file ${replay.fileRecord._id} at path: ${filePath}`);
      }
      gameAndFileRecord = { ...replay.fileRecord, ...replay.gameRecord };
      playerRecords = replay.playerRecords;
    }

    return mapGameRecordToFileResult(gameAndFileRecord, playerRecords);
  }

  public async calculateGameStats(fullPath: string): Promise<StatsType | null> {
    const game = new SlippiGame(fullPath);
    const settings = game.getSettings();
    if (!settings || settings.players.length === 0) {
      throw new Error("Game settings could not be properly loaded.");
    }

    if (settings.players.length !== 2) {
      throw new Error("Stats can only be calculated for 1v1s.");
    }

    return game.getStats();
  }

  public async calculateStadiumStats(fullPath: string): Promise<StadiumStatsType | null> {
    const game = new SlippiGame(fullPath);
    return game.getStadiumStats();
  }

  public async deleteReplays(fileIds: string[]): Promise<void> {
    const deleteStartTime = Date.now();
    log.info(`Deleting ${fileIds.length} replay(s) by ID`);

    // Convert string IDs to numbers
    const numericFileIds = fileIds.map((id) => parseInt(id, 10));

    // Get the file records to get the file paths
    const fileRecords = await this.queryFileRecordsByIds(numericFileIds);

    if (fileRecords.length === 0) {
      log.warn("No files found for the given IDs");
      return;
    }

    // Delete the records from the database first (cascades to game and player records)
    await this.deleteFileRecordsFromDatabase(numericFileIds);

    // Delete files from the filesystem
    await this.deleteFilesFromFilesystem(fileRecords);

    const totalDuration = Date.now() - deleteStartTime;
    log.info(`Deleted ${fileRecords.length} replay(s) in ${totalDuration}ms total`);
  }

  public async bulkDeleteReplays(
    folder: string | undefined,
    filters: ReplayFilter[] = [],
    options?: {
      excludeFilePaths?: string[];
    },
  ): Promise<{ deletedCount: number }> {
    const bulkDeleteStartTime = Date.now();
    log.info(
      `Starting bulk delete with ${filters.length} filter(s) and ${options?.excludeFilePaths?.length ?? 0} exclusions`,
    );

    // Sync the database first to ensure we're working with up-to-date data
    // Only sync if folder is specified and exists on disk
    if (folder !== undefined && (await fs.pathExists(folder))) {
      const syncStartTime = Date.now();
      await this.syncReplayDatabase(folder, undefined, INSERT_REPLAY_BATCH_SIZE);
      const syncDuration = Date.now() - syncStartTime;
      log.info(`Pre-delete sync completed in ${syncDuration}ms`);
    }

    // Convert file paths to file IDs for exclusion
    // Batch the query to stay under SQLite's 999 parameter limit
    const excludeFileIds: number[] = [];
    if (options?.excludeFilePaths && options.excludeFilePaths.length > 0) {
      const excludeQueryStartTime = Date.now();
      const excludeFilenames = options.excludeFilePaths.map((p) => path.basename(p));
      const chunkedFilenames = chunk(excludeFilenames, SQLITE_PARAM_LIMIT_BATCH_SIZE);

      for (const batch of chunkedFilenames) {
        let excludeQuery = this.db.selectFrom("file");

        // Apply folder filter if specified
        if (folder !== undefined) {
          excludeQuery = excludeQuery.where("folder", "=", folder);
        }

        const excludeRecords = await excludeQuery.where("name", "in", batch).select("_id").execute();
        excludeFileIds.push(...excludeRecords.map((r) => r._id));
      }

      const excludeQueryDuration = Date.now() - excludeQueryStartTime;
      log.info(`Exclude query completed in ${excludeQueryDuration}ms (found ${excludeFileIds.length} exclusions)`);
    }

    // Get all file IDs matching the filters
    const filterQueryStartTime = Date.now();
    const fileIdsToDelete = await GameRepository.getFileIdsForBulkDelete(
      this.db,
      folder ?? null,
      filters,
      excludeFileIds.length > 0 ? excludeFileIds : undefined,
    );
    const filterQueryDuration = Date.now() - filterQueryStartTime;
    log.info(`Filter query completed in ${filterQueryDuration}ms (found ${fileIdsToDelete.length} files to delete)`);

    if (fileIdsToDelete.length === 0) {
      log.info("No files to delete");
      return { deletedCount: 0 };
    }

    // Get the file records to get the file paths
    const fileRecords = await this.queryFileRecordsByIds(fileIdsToDelete);

    // Delete the records from the database first (cascades to game and player records)
    await this.deleteFileRecordsFromDatabase(fileIdsToDelete);

    // Delete files from the filesystem
    await this.deleteFilesFromFilesystem(fileRecords);

    const totalDuration = Date.now() - bulkDeleteStartTime;
    log.info(`Bulk deleted ${fileRecords.length} replay(s) in ${totalDuration}ms total`);
    return { deletedCount: fileRecords.length };
  }

  private async mapGameAndFileRecordsToFileResult(records: (GameRecord & FileRecord)[]): Promise<FileResult[]> {
    const gameIds = records.map((game) => game._id);
    const playerMap = await PlayerRepository.findAllPlayersByGame(this.db, ...gameIds);
    return records.map((gameRecord): FileResult => {
      const players = playerMap.get(gameRecord._id) ?? [];
      return mapGameRecordToFileResult(gameRecord, players);
    });
  }

  /**
   * Query file records by IDs with automatic chunking to stay under SQLite parameter limits.
   * @param fileIds - Array of file IDs to query
   * @returns Array of file records
   */
  private async queryFileRecordsByIds(fileIds: number[]): Promise<FileRecord[]> {
    const queryStartTime = Date.now();
    const chunkedFileIds = chunk(fileIds, SQLITE_PARAM_LIMIT_BATCH_SIZE);
    const fileRecords: FileRecord[] = [];

    for (const batch of chunkedFileIds) {
      const batchRecords = await this.db.selectFrom("file").where("file._id", "in", batch).selectAll().execute();
      fileRecords.push(...batchRecords);
    }

    const queryDuration = Date.now() - queryStartTime;
    log.info(`File record query completed in ${queryDuration}ms (found ${fileRecords.length} records)`);

    return fileRecords;
  }

  /**
   * Delete file records from database by IDs with automatic chunking.
   * Cascades to game and player records.
   * @param fileIds - Array of file IDs to delete
   */
  private async deleteFileRecordsFromDatabase(fileIds: number[]): Promise<void> {
    const dbDeleteStartTime = Date.now();
    const chunkedDeleteIds = chunk(fileIds, SQLITE_PARAM_LIMIT_BATCH_SIZE);

    for (const batch of chunkedDeleteIds) {
      await FileRepository.deleteFileById(this.db, ...batch);
    }

    const dbDeleteDuration = Date.now() - dbDeleteStartTime;
    log.info(`Database delete completed in ${dbDeleteDuration}ms (deleted ${fileIds.length} records)`);
  }

  /**
   * Delete files from filesystem by moving them to trash.
   * @param fileRecords - Array of file records to delete from filesystem
   * @returns Number of files that failed to delete
   */
  private async deleteFilesFromFilesystem(fileRecords: FileRecord[]): Promise<number> {
    const fsDeleteStartTime = Date.now();
    const filePaths = fileRecords.map((record) => path.resolve(record.folder, record.name));
    const deletePromises = await Promise.allSettled(filePaths.map((filePath) => shell.trashItem(filePath)));
    const errCount = deletePromises.reduce((curr, { status }) => (status === "rejected" ? curr + 1 : curr), 0);
    const fsDeleteDuration = Date.now() - fsDeleteStartTime;

    if (errCount > 0) {
      log.warn(`${errCount} file(s) failed to delete from filesystem in ${fsDeleteDuration}ms`);
    } else {
      log.info(`Filesystem delete completed in ${fsDeleteDuration}ms`);
    }

    return errCount;
  }

  private async syncReplayDatabase(
    folder: string,
    onProgress?: (progress: Progress) => void,
    batchSize = 100,
    requestId?: number,
  ) {
    const syncStartTime = Date.now();
    const [fileResults, existingFiles] = await Promise.all([
      fs.readdir(folder, { withFileTypes: true }),
      FileRepository.findAllFilesInFolder(this.db, folder),
    ]);

    const slpFileNames = fileResults
      .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
      .map((dirent) => dirent.name);

    const reqLog = requestId ? `[Request ${requestId}] ` : "";
    log.info(`${reqLog}Found ${slpFileNames.length} .slp files on disk, ${existingFiles.length} files in database`);

    // Find all records in the database that no longer exist
    const deleteOldReplays = async () => {
      const deleteStartTime = Date.now();
      const setOfSlpFileNames = new Set(slpFileNames);
      const fileIdsToDelete = existingFiles.filter(({ name }) => !setOfSlpFileNames.has(name)).map(({ _id }) => _id);

      if (fileIdsToDelete.length === 0) {
        log.info("No replays to delete");
        return;
      }

      log.info(`Deleting ${fileIdsToDelete.length} replays that no longer exist on disk`);
      const chunkedFileIdsToDelete = chunk(fileIdsToDelete, batchSize);
      let deletedCount = 0;

      for (const batch of chunkedFileIdsToDelete) {
        const batchStartTime = Date.now();
        await FileRepository.deleteFileById(this.db, ...batch);
        deletedCount += batch.length;
        const batchDuration = Date.now() - batchStartTime;
        log.info(
          `Deleted batch of ${batch.length} replays in ${batchDuration}ms (${deletedCount}/${fileIdsToDelete.length})`,
        );
      }

      const deleteDuration = Date.now() - deleteStartTime;
      log.info(`Completed deleting ${fileIdsToDelete.length} replays in ${deleteDuration}ms`);
    };

    // Find all new SLP files that are not yet in the database
    const insertNewReplays = async () => {
      const insertStartTime = Date.now();
      const setOfExistingReplayNames = new Set(existingFiles.map((r) => r.name));
      const slpFilesToAdd = slpFileNames.filter((name) => !setOfExistingReplayNames.has(name));
      const total = slpFilesToAdd.length;

      if (total === 0) {
        log.info("No new replays to add");
        return;
      }

      log.info(`Adding ${total} new replays to database`);
      let replaysAdded = 0;
      const chunkedReplays = chunk(slpFilesToAdd, batchSize);

      // Process each batch in a single transaction for optimal performance
      // This reduces transaction overhead from N transactions to 1 per batch
      for (const batch of chunkedReplays) {
        if (this.isRequestSuperseded(requestId)) {
          onProgress?.({ current: replaysAdded, total });
          return;
        }

        const batchStartTime = Date.now();
        const batchResults = await this.db.transaction().execute(async (trx) => {
          const results: Array<{ success: boolean; error?: any }> = [];

          // Process files sequentially within the transaction
          // SQLite is single-writer, so parallel processing just creates lock contention
          for (const filename of batch) {
            if (this.isRequestSuperseded(requestId)) {
              break;
            }

            try {
              await this.insertNewReplayFileInTransaction(trx, folder, filename);
              results.push({ success: true });
            } catch (err) {
              results.push({ success: false, error: err });
            }
          }

          return results;
        });

        const successful = batchResults.filter((r) => r.success).length;
        const failed = batchResults.filter((r) => !r.success);

        replaysAdded += successful;
        const batchDuration = Date.now() - batchStartTime;
        const filesPerSec = Math.round((successful / batchDuration) * 1000);
        log.info(`Added ${replaysAdded}/${total} replays in ${batchDuration}ms (${filesPerSec} files/sec)`);

        if (failed.length > 0) {
          log.warn(`Failed to add ${failed.length} replay(s): `, failed[0].error);
        }

        onProgress?.({ current: replaysAdded, total });
      }

      const insertDuration = Date.now() - insertStartTime;
      const totalFilesPerSec = Math.round((replaysAdded / insertDuration) * 1000);
      log.info(`Completed adding ${replaysAdded} replays in ${insertDuration}ms (avg ${totalFilesPerSec} files/sec)`);

      onProgress?.({ current: total, total });
    };

    // Run delete and insert sequentially for better performance
    // SQLite is single-writer, so running these in parallel just adds overhead
    // and lock contention without any benefit
    try {
      await deleteOldReplays();
    } catch (err) {
      log.warn("Error removing deleted replays: " + err);
    }

    try {
      await insertNewReplays();
    } catch (err) {
      throw new Error("Error inserting new replays: " + err);
    }

    const syncDuration = Date.now() - syncStartTime;
    log.info(`Total sync operation completed in ${syncDuration}ms`);
  }

  /**
   * Insert a new replay file within an existing transaction.
   * This is the core implementation used by both batch processing and single-file operations.
   *
   * @param trx - The transaction to use for the insert
   * @param folder - The folder containing the replay file
   * @param filename - The name of the replay file
   * @returns The inserted file, game, and player records
   */
  private async insertNewReplayFileInTransaction(
    trx: Transaction<Database>,
    folder: string,
    filename: string,
  ): Promise<{ fileRecord: FileRecord; gameRecord: GameRecord | undefined; playerRecords: PlayerRecord[] }> {
    const fullPath = path.resolve(folder, filename);
    const game = new SlippiGame(fullPath);
    const newFile = await generateNewFile(folder, filename);

    const fileRecord = await FileRepository.insertFile(trx, newFile);

    const newGame = generateNewGame(fileRecord, game);
    if (!newGame) {
      return { fileRecord, gameRecord: undefined, playerRecords: [] };
    }

    const gameRecord = await GameRepository.insertGame(trx, newGame);
    const newPlayers = generateNewPlayers(gameRecord._id, game);
    const playerRecords = await PlayerRepository.insertPlayer(trx, ...newPlayers);

    return { fileRecord, gameRecord, playerRecords };
  }

  /**
   * Insert a new replay file (creates its own transaction).
   * This method is used for single-file operations like loading a file that isn't in the database.
   *
   * @param folder - The folder containing the replay file
   * @param filename - The name of the replay file
   * @returns The inserted file, game, and player records
   */
  private async insertNewReplayFile(
    folder: string,
    filename: string,
  ): Promise<{ fileRecord: FileRecord; gameRecord: GameRecord | undefined; playerRecords: PlayerRecord[] }> {
    return await this.db.transaction().execute(async (trx) => {
      return await this.insertNewReplayFileInTransaction(trx, folder, filename);
    });
  }
}

async function generateNewFile(folder: string, filename: string): Promise<NewFile> {
  const fullPath = path.resolve(folder, filename);
  let size = 0;
  let birthtime: string | null = null;
  try {
    const fileInfo = await fs.stat(fullPath);
    size = fileInfo.size;
    birthtime = fileInfo.birthtime.toISOString();
  } catch (err) {
    log.warn(`Error running stat for file ${fullPath}: `, err);
  }
  const newReplay: NewFile = {
    name: filename,
    folder,
    size_bytes: size,
    birth_time: birthtime,
  };
  return newReplay;
}

function generateNewGame(file: FileRecord, game: SlippiGame): NewGame | null {
  // Load settings
  const settings = game.getSettings();
  if (!settings || settings.players.length === 0) {
    return null;
  }
  const metadata = game.getMetadata();

  const sessionId = settings.matchInfo?.sessionId ?? null;
  const isRanked = sessionId != null && sessionId.startsWith("mode.ranked-");

  const gameStartTime = inferStartTime(metadata?.startAt ?? null, file.name, file.birth_time);

  const newGame: NewGame = {
    file_id: file._id,
    is_ranked: boolToInt(isRanked),
    is_teams: boolToInt(settings.isTeams ?? false),
    stage: settings.stageId,
    start_time: gameStartTime,
    platform: metadata?.playedOn,
    console_nickname: metadata?.consoleNick,
    mode: settings.gameMode,
    last_frame: metadata?.lastFrame,
    timer_type: settings.timerType,
    starting_timer_secs: settings.startingTimerSeconds,
    session_id: sessionId,
    game_number: settings.matchInfo?.gameNumber ?? undefined,
    tiebreak_number: settings.matchInfo?.tiebreakerNumber ?? undefined,
  };

  return newGame;
}

function generateNewPlayers(gameId: number, game: SlippiGame): NewPlayer[] {
  const settings = game.getSettings();
  if (!settings || settings.players.length === 0) {
    return [];
  }

  const winnerIndices = game.getWinners().map((winner) => winner.playerIndex);
  return settings.players.map((player): NewPlayer => {
    const isWinner = winnerIndices.includes(player.playerIndex);
    const names = extractPlayerNames(player.playerIndex, settings, game.getMetadata());
    const newPlayer: NewPlayer = {
      game_id: gameId,
      port: player.playerIndex + 1,
      type: player.type,
      character_id: player.characterId,
      character_color: player.characterColor,
      team_id: settings.isTeams ? player.teamId : undefined,
      is_winner: boolToIntOrNull(isWinner),
      start_stocks: player.startStocks,
      connect_code: names.code,
      display_name: names.name,
      tag: names.tag,
      user_id: player.userId,
    };
    return newPlayer;
  });
}
