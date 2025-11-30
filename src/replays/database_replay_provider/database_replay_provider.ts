import { chunk } from "@common/chunk";
import { partition } from "@common/partition";
import type { ReplayFilter } from "@database/filters/types";
import { FileRepository } from "@database/repositories/file_repository";
import { GameRepository } from "@database/repositories/game_repository";
import { PlayerRepository } from "@database/repositories/player_repository";
import type { Database, FileRecord, GameRecord, NewFile, NewGame, NewPlayer, PlayerRecord } from "@database/schema";
import { boolToInt, boolToIntOrNull } from "@database/utils";
import type { FileLoadResult, FileResult, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
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
    folder: string,
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
  }> {
    // If the folder does not exist, return empty
    if (!(await fs.pathExists(folder))) {
      return {
        files: [],
        continuation: undefined,
      };
    }

    const maybeContinuationToken = Continuation.fromString(continuation);
    const continuationValue = maybeContinuationToken?.getValue() ?? null;
    const nextIdInclusive = maybeContinuationToken?.getNextIdInclusive() ?? null;

    // Sync the database first (add new files, remove deleted files)
    // Only sync if we're not using continuation (i.e., first page of results)
    if (continuationValue === null && nextIdInclusive === null) {
      await this.syncReplayDatabase(folder, onProgress, INSERT_REPLAY_BATCH_SIZE);
    }

    // Use GameRepository.searchGames which supports filters
    const records = await GameRepository.searchGames(this.db, folder, filters, {
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
    };
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

  public async loadFolder(folder: string, onProgress?: (progress: Progress) => void): Promise<FileLoadResult> {
    // If the folder does not exist, return empty
    if (!(await fs.pathExists(folder))) {
      return {
        files: [],
        fileErrorCount: 0,
        totalBytes: 0,
      };
    }

    // Add new files to the database and remove deleted files
    await this.syncReplayDatabase(folder, onProgress, INSERT_REPLAY_BATCH_SIZE);

    const [gameRecords, totalBytes] = await Promise.all([
      GameRepository.findGamesByFolder(this.db, folder),
      FileRepository.findTotalSizeByFolder(this.db, folder),
    ]);

    const files = await this.mapGameAndFileRecordsToFileResult(gameRecords);

    const result: FileLoadResult = {
      files,
      totalBytes,
      fileErrorCount: 0,
    };
    return result;
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
