import { chunk } from "@common/chunk";
import { partition } from "@common/partition";
import type { FileLoadResult, FileResult, PlayerInfo, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import { SlippiGame } from "@slippi/slippi-js";
import * as GameRepository from "database/repositories/game_repository";
import * as PlayerRepository from "database/repositories/player_repository";
import * as ReplayRepository from "database/repositories/replay_repository";
import type { Database, NewGame, NewPlayer, NewReplay } from "database/schema";
import log from "electron-log";
import * as fs from "fs-extra";
import type { Kysely } from "kysely";
import path from "path";

import { extractPlayerNames } from "../file_system_replay_provider/extract_player_names";
import { mapGameRecordToFileResult, mapPlayerRecordToPlayerInfo } from "./record_mapper";

const NUM_REPLAYS_TO_RETURN = 200;
const INSERT_REPLAY_BATCH_SIZE = 200;

export class DatabaseReplayProvider implements ReplayProvider {
  constructor(private readonly db: Kysely<Database>) {}

  public async loadFile(filePath: string): Promise<FileResult> {
    const filename = path.basename(filePath);
    const folder = path.dirname(filePath);

    let gameRecord = await GameRepository.findGameByFolderAndFilename(this.db, folder, filename);

    if (!gameRecord) {
      // Add the game if it doesn't already exist in our database
      const { replayId } = await this.addReplay(folder, filename);

      // TODO: Figure out how to return the game record directly after adding
      // to avoid needing to do another database query
      gameRecord = await GameRepository.findGameByReplayId(this.db, replayId);
      if (!gameRecord) {
        throw new Error(`Could not find replay ${replayId} at path: ${filePath}`);
      }
    }

    const playerRecords = await PlayerRepository.findAllPlayersByGame(this.db, gameRecord._id);
    const players = playerRecords.map(mapPlayerRecordToPlayerInfo);
    return mapGameRecordToFileResult(gameRecord, players);
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

    const gameRecords = await GameRepository.findGamesByFolder(this.db, folder, NUM_REPLAYS_TO_RETURN);
    const players = await Promise.all(
      gameRecords.map(async ({ _id: gameId }): Promise<[number, PlayerInfo[]]> => {
        const playerRecords = await PlayerRepository.findAllPlayersByGame(this.db, gameId);
        const playerInfos = playerRecords.map(mapPlayerRecordToPlayerInfo);
        return [gameId, playerInfos];
      }),
    );
    const playerMap = new Map(players);

    const files = gameRecords.map((gameRecord): FileResult => {
      const players = playerMap.get(gameRecord._id) ?? [];
      return mapGameRecordToFileResult(gameRecord, players);
    });

    const result: FileLoadResult = {
      files,
      totalBytes: 0,
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

  private async syncReplayDatabase(folder: string, onProgress?: (progress: Progress) => void, batchSize = 100) {
    const [fileResults, existingReplays] = await Promise.all([
      fs.readdir(folder, { withFileTypes: true }),
      ReplayRepository.findAllReplaysInFolder(this.db, folder),
    ]);

    const slpFileNames = fileResults
      .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
      .map((dirent) => dirent.name);

    // Find all records in the database that no longer exist
    const deleteOldReplays = async () => {
      const setOfSlpFileNames = new Set(slpFileNames);
      const fileIdsToDelete = existingReplays
        .filter(({ file_name }) => !setOfSlpFileNames.has(file_name))
        .map(({ _id }) => _id);
      const chunkedFileIdsToDelete = chunk(fileIdsToDelete, batchSize);
      for (const batch of chunkedFileIdsToDelete) {
        await ReplayRepository.deleteReplayById(this.db, ...batch);
      }
    };

    // Find all new SLP files that are not yet in the database
    const insertNewReplays = async () => {
      const setOfExistingReplayNames = new Set(existingReplays.map((r) => r.file_name));
      const slpFilesToAdd = slpFileNames.filter((name) => !setOfExistingReplayNames.has(name));
      const total = slpFilesToAdd.length;

      let replaysAdded = 0;
      const chunkedReplays = chunk(slpFilesToAdd, batchSize);
      for (const batch of chunkedReplays) {
        const results = await Promise.allSettled(
          batch.map(async (filename): Promise<void> => {
            await this.addReplay(folder, filename);
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

  private async generateNewReplay(folder: string, filename: string): Promise<NewReplay> {
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
    const newReplay: NewReplay = {
      file_name: filename,
      folder,
      size_bytes: size,
      birth_time: birthtime,
    };
    return newReplay;
  }

  private generateNewGame(replayId: number, game: SlippiGame): NewGame | null {
    // Load settings
    const settings = game.getSettings();
    if (!settings || settings.players.length === 0) {
      return null;
    }
    const metadata = game.getMetadata();

    const newGame: NewGame = {
      replay_id: replayId,
      is_teams: Number(settings.isTeams),
      stage: settings.stageId,
      start_time: metadata?.startAt,
      platform: metadata?.playedOn,
      console_nickname: metadata?.consoleNick,
      mode: settings.gameMode,
      last_frame: metadata?.lastFrame,
      timer_type: settings.timerType,
      starting_timer_secs: settings.startingTimerSeconds,
    };

    return newGame;
  }

  private generateNewPlayers(gameId: number, game: SlippiGame): NewPlayer[] {
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
        index: player.playerIndex,
        type: player.type,
        character_id: player.characterId,
        character_color: player.characterColor,
        team_id: settings.isTeams ? player.teamId : undefined,
        is_winner: Number(isWinner),
        start_stocks: player.startStocks,
        connect_code: names.code,
        display_name: names.name,
        tag: names.tag,
        user_id: player.userId,
      };
      return newPlayer;
    });
  }

  private async addReplay(folder: string, filename: string): Promise<{ replayId: number }> {
    const fullPath = path.resolve(folder, filename);
    const game = new SlippiGame(fullPath);

    const newReplay = await this.generateNewReplay(folder, filename);

    return await this.db.transaction().execute(async (trx) => {
      const { _id: replayId } = await ReplayRepository.insertReplay(trx, newReplay);

      const newGame = this.generateNewGame(replayId, game);
      // Ensure we have a valid game
      if (newGame) {
        const { _id: gameId } = await GameRepository.insertGame(trx, newGame);
        await Promise.all(
          this.generateNewPlayers(gameId, game).map((newPlayer) => {
            return PlayerRepository.insertPlayer(trx, newPlayer);
          }),
        );
      }

      return { replayId };
    });
  }
}
