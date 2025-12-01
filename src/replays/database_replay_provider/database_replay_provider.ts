import { chunk } from "@common/chunk";
import { partition } from "@common/partition";
import type { ReplayFilter } from "@database/filters/types";
import { FileRepository } from "@database/repositories/file_repository";
import { GameRepository } from "@database/repositories/game_repository";
import { PlayerRepository } from "@database/repositories/player_repository";
import type { Database, FileRecord, GameRecord, NewFile, NewGame, NewPlayer, PlayerRecord } from "@database/schema";
import { boolToInt, boolToIntOrNull } from "@database/utils";
import type { FileResult, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
import { shell } from "electron";
import log from "electron-log";
import * as fs from "fs-extra";
import type { Kysely } from "kysely";
import path from "path";

import { extractPlayerNames } from "../extract_player_names";
import { Continuation } from "./continuation";
import { inferStartTime } from "./infer_start_time";
import { mapGameRecordToFileResult } from "./record_mapper";

const INSERT_REPLAY_BATCH_SIZE = 200;
const SEARCH_REPLAYS_LIMIT = 20;

export class DatabaseReplayProvider implements ReplayProvider {
  constructor(private readonly db: Kysely<Database>) {}

  public async searchReplays(
    folder: string | undefined,
    limit = SEARCH_REPLAYS_LIMIT,
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
    // If the folder is specified but does not exist, return empty
    if (folder !== undefined && !(await fs.pathExists(folder))) {
      return {
        files: [],
        continuation: undefined,
        totalCount: 0,
      };
    }

    const maybeContinuationToken = Continuation.fromString(continuation);
    const continuationValue = maybeContinuationToken?.getValue() ?? null;
    const nextIdInclusive = maybeContinuationToken?.getNextIdInclusive() ?? null;

    // Sync the database first (add new files, remove deleted files)
    // Only sync if we're not using continuation (i.e., first page of results) and folder is specified
    if (folder !== undefined && continuationValue === null && nextIdInclusive === null) {
      await this.syncReplayDatabase(folder, onProgress, INSERT_REPLAY_BATCH_SIZE);
    }

    // Get total count on first page load (when there's no continuation)
    let totalCount: number | undefined;
    if (continuationValue === null && nextIdInclusive === null) {
      totalCount = await GameRepository.countGames(this.db, folder ?? null, filters);
    }

    // Use GameRepository.searchGames which supports filters
    const records = await GameRepository.searchGames(this.db, folder ?? null, filters, {
      limit: limit + 1,
      orderBy: {
        field: orderBy.field,
        direction: orderBy.direction ?? "desc",
      },
      continuationValue,
      nextIdInclusive: nextIdInclusive ?? undefined,
    });

    const [recordsToReturn, newContinuation] = Continuation.truncate(records, limit, (record) => ({
      value: orderBy.field === "startTime" ? record.start_time ?? "null" : record.last_frame?.toString() ?? "null",
      nextIdInclusive: record._id,
    }));

    const files = await this.mapGameAndFileRecordsToFileResult(recordsToReturn);

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
    // If the folder is specified but does not exist, return empty
    if (folder !== undefined && !(await fs.pathExists(folder))) {
      return [];
    }

    // Sync the database first (add new files, remove deleted files)
    // Only sync if folder is specified
    if (folder !== undefined) {
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
    // Convert string IDs to numbers
    const numericFileIds = fileIds.map((id) => parseInt(id, 10));

    // Get the file records to get the file paths
    const fileRecords = await this.db.selectFrom("file").where("file._id", "in", numericFileIds).selectAll().execute();

    if (fileRecords.length === 0) {
      log.warn("No files found for the given IDs");
      return;
    }

    // Delete the records from the database first (cascades to game and player records)
    await FileRepository.deleteFileById(this.db, ...numericFileIds);

    // Delete files from the filesystem
    const filePaths = fileRecords.map((record) => path.resolve(record.folder, record.name));
    const deletePromises = await Promise.allSettled(filePaths.map((filePath) => shell.trashItem(filePath)));
    const errCount = deletePromises.reduce((curr, { status }) => (status === "rejected" ? curr + 1 : curr), 0);
    if (errCount > 0) {
      log.warn(`${errCount} file(s) failed to delete from filesystem`);
    }

    log.info(`Deleted ${fileRecords.length} replay(s)`);
  }

  public async bulkDeleteReplays(
    folder: string | undefined,
    filters: ReplayFilter[] = [],
    options?: {
      excludeFilePaths?: string[];
    },
  ): Promise<{ deletedCount: number }> {
    // If the folder is specified but does not exist, return
    if (folder !== undefined && !(await fs.pathExists(folder))) {
      return { deletedCount: 0 };
    }

    // Sync the database first to ensure we're working with up-to-date data
    // Only sync if folder is specified
    if (folder !== undefined) {
      await this.syncReplayDatabase(folder, undefined, INSERT_REPLAY_BATCH_SIZE);
    }

    // Convert file paths to file IDs for exclusion
    let excludeFileIds: number[] = [];
    if (options?.excludeFilePaths && options.excludeFilePaths.length > 0) {
      let excludeQuery = this.db.selectFrom("file");

      // Apply folder filter if specified
      if (folder !== undefined) {
        excludeQuery = excludeQuery.where("folder", "=", folder);
      }

      const excludeRecords = await excludeQuery
        .where(
          "name",
          "in",
          options.excludeFilePaths.map((p) => path.basename(p)),
        )
        .select("_id")
        .execute();
      excludeFileIds = excludeRecords.map((r) => r._id);
    }

    // Get all file IDs matching the filters
    const fileIdsToDelete = await GameRepository.getFileIdsForBulkDelete(
      this.db,
      folder ?? null,
      filters,
      excludeFileIds.length > 0 ? excludeFileIds : undefined,
    );

    if (fileIdsToDelete.length === 0) {
      log.info("No files to delete");
      return { deletedCount: 0 };
    }

    // Get the file records to get the file paths
    const fileRecords = await this.db.selectFrom("file").where("file._id", "in", fileIdsToDelete).selectAll().execute();

    // Delete the records from the database first (cascades to game and player records)
    await FileRepository.deleteFileById(this.db, ...fileIdsToDelete);

    // Delete files from the filesystem
    const filePaths = fileRecords.map((record) => path.resolve(record.folder, record.name));
    const deletePromises = await Promise.allSettled(filePaths.map((filePath) => shell.trashItem(filePath)));
    const errCount = deletePromises.reduce((curr, { status }) => (status === "rejected" ? curr + 1 : curr), 0);
    if (errCount > 0) {
      log.warn(`${errCount} file(s) failed to delete from filesystem`);
    }

    log.info(`Bulk deleted ${fileRecords.length} replay(s)`);
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

  private async syncReplayDatabase(folder: string, onProgress?: (progress: Progress) => void, batchSize = 100) {
    const [fileResults, existingFiles] = await Promise.all([
      fs.readdir(folder, { withFileTypes: true }),
      FileRepository.findAllFilesInFolder(this.db, folder),
    ]);

    const slpFileNames = fileResults
      .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
      .map((dirent) => dirent.name);

    // Find all records in the database that no longer exist
    const deleteOldReplays = async () => {
      const setOfSlpFileNames = new Set(slpFileNames);
      const fileIdsToDelete = existingFiles.filter(({ name }) => !setOfSlpFileNames.has(name)).map(({ _id }) => _id);
      const chunkedFileIdsToDelete = chunk(fileIdsToDelete, batchSize);
      for (const batch of chunkedFileIdsToDelete) {
        await FileRepository.deleteFileById(this.db, ...batch);
      }
    };

    // Find all new SLP files that are not yet in the database
    const insertNewReplays = async () => {
      const setOfExistingReplayNames = new Set(existingFiles.map((r) => r.name));
      const slpFilesToAdd = slpFileNames.filter((name) => !setOfExistingReplayNames.has(name));
      const total = slpFilesToAdd.length;

      let replaysAdded = 0;
      const chunkedReplays = chunk(slpFilesToAdd, batchSize);
      for (const batch of chunkedReplays) {
        const results = await Promise.allSettled(
          batch.map(async (filename): Promise<void> => {
            await this.insertNewReplayFile(folder, filename);
          }),
        );

        const [successful, failed] = partition<PromiseFulfilledResult<void>, PromiseRejectedResult>(
          results,
          (r) => r.status === "fulfilled",
        );
        replaysAdded += successful.length;
        log.info(`Added ${replaysAdded} out of ${total} replays`);
        if (failed.length > 0) {
          log.warn(`Failed to add ${failed.length} replay(s): `, failed[0].reason);
        }

        onProgress?.({ current: replaysAdded, total });
      }

      onProgress?.({ current: total, total });
    };

    const [deleteResult, insertResult] = await Promise.allSettled([deleteOldReplays(), insertNewReplays()]);
    if (deleteResult.status === "rejected") {
      log.warn("Error removing deleted replays: " + deleteResult.reason);
    }
    if (insertResult.status === "rejected") {
      throw new Error("Error inserting new replays: " + insertResult.reason);
    }
  }

  private async insertNewReplayFile(
    folder: string,
    filename: string,
  ): Promise<{ fileRecord: FileRecord; gameRecord: GameRecord | undefined; playerRecords: PlayerRecord[] }> {
    const fullPath = path.resolve(folder, filename);
    const game = new SlippiGame(fullPath);

    const newFile = await generateNewFile(folder, filename);

    return await this.db.transaction().execute(async (trx) => {
      const fileRecord = await FileRepository.insertFile(trx, newFile);

      const newGame = generateNewGame(fileRecord, game);
      if (!newGame) {
        return { fileRecord, gameRecord: undefined, playerRecords: [] };
      }

      const gameRecord = await GameRepository.insertGame(trx, newGame);
      const newPlayers = generateNewPlayers(gameRecord._id, game);
      const playerRecords = await PlayerRepository.insertPlayer(trx, ...newPlayers);

      return { fileRecord, gameRecord, playerRecords };
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
