import { exists } from "@common/exists";
import type { FileLoadResult, FileResult, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import DatabaseConstructor from "better-sqlite3";
import * as fs from "fs-extra";
import { Kysely, SqliteDialect } from "kysely";
import _ from "lodash";
import path from "path";

import { loadFile } from "./load_file";
import type {
  Database,
  NewReplay,
  NewReplayGameStart,
  NewReplayMetadata,
  NewReplayPlayer,
  ReplayGameStart,
  ReplayMetadata,
  ReplayPlayer,
} from "./schema";

export class DatabaseReplayProvider implements ReplayProvider {
  private database: Kysely<Database>;

  constructor(databaseName: string) {
    const dialect = new SqliteDialect({
      database: new DatabaseConstructor(databaseName),
    });

    this.database = new Kysely<Database>({
      dialect,
    });

    // await migrateToLatest(db);

    // Databases[databaseName] = db;
    // return db;
  }

  public init(): void {
    // Do nothing
  }
  public loadFile(filePath: string): Promise<FileResult> {
    throw new Error("Method not implemented.");
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

    const results = await fs.readdir(folder, { withFileTypes: true });
    const fullSlpPaths = results
      .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".slp")
      .map((dirent) => path.resolve(folder, dirent.name));

    // Get already processed files from database
    const replaysIndexed = await this.loadReplays(fullSlpPaths);
    const totalBytesIndexed = replaysIndexed.reduce((acc, replay) => acc + replay.size, 0);

    // Calculate files that still need to be processed
    const fullSlpPathsIndexed = replaysIndexed.map((replay) => replay.fullPath);
    const fullSlpPathsNew = fullSlpPaths.filter((dirent) => !fullSlpPathsIndexed.includes(dirent));

    // Ensure we actually have files to process
    const total = fullSlpPaths.length;
    if (total === 0) {
      return {
        files: replaysIndexed,
        fileErrorCount: 0,
        totalBytes: totalBytesIndexed,
      };
    }

    let fileValidCount = 0;
    onProgress?.({ current: 0, total });

    const process = async (path: string) => {
      return new Promise<FileResult | null>((resolve) => {
        setImmediate(async () => {
          try {
            const res = await loadFile(path);
            res.size = (await fs.stat(path)).size;
            fileValidCount += 1;
            onProgress?.({ current: fileValidCount, total });
            resolve(res);
          } catch (err) {
            resolve(null);
          }
        });
      });
    };

    const slpGames = await Promise.all(
      fullSlpPathsNew.map((fullPath) => {
        return process(fullPath);
      }),
    );
    const replaysNew = slpGames.filter(exists);

    const totalBytesNew = replaysNew.reduce((acc, replay) => acc + replay.size, 0);

    // Insert newly processed files
    await this.insertReplays(replaysNew);

    // Indicate that loading is complete
    onProgress?.({ current: total, total });

    return {
      files: replaysIndexed.concat(replaysNew),
      fileErrorCount: total - fileValidCount,
      totalBytes: totalBytesIndexed + totalBytesNew,
    };
  }
  public calculateGameStats(fullPath: string): Promise<StatsType | null> {
    throw new Error("Method not implemented.");
  }
  public calculateStadiumStats(fullPath: string): Promise<StadiumStatsType | null> {
    throw new Error("Method not implemented.");
  }

  private async loadReplays(fullPaths: string[]): Promise<FileResult[]> {
    const replays = await this.database
      .selectFrom("replay")
      .where("replay.fullPath", "in", fullPaths)
      .innerJoin("replay_game_start", "replay_game_start.replayId", "replay.id")
      .innerJoin("replay_player", "replay_player.settingsId", "replay_game_start.id")
      .innerJoin("replay_metadata", "replay_metadata.replayId", "replay.id")
      .selectAll(["replay", "replay_game_start", "replay_player", "replay_metadata"])
      .execute();
    const replayGroups = Object.values(_.groupBy(replays, "id"));
    const replayObjs = replayGroups.map((replay) => {
      const replayObj = replay[0] as any;
      replayObj.winnerIndices = JSON.parse(replay[0].winnerIndices);
      replayObj.settings = replay[0] as ReplayGameStart;
      replayObj.settings.players = replay.map((player) => player as ReplayPlayer);
      replayObj.metadata = replay[0] as ReplayMetadata;
      return replayObj as FileResult;
    });
    return replayObjs as FileResult[];
  }

  private async insertReplays(replays: FileResult[]) {
    if (replays.length == 0) {
      return;
    }

    // Preserve replay properties for later insert
    const replaysCopy = _.cloneDeep(replays);
    const metadataObjs = replaysCopy.map((replay) => replay.metadata);
    const playerObjs = replaysCopy.map((replay) => replay.settings.players);
    const settingsObjs = replaysCopy.map((replay) => replay.settings);

    // Insert replay files
    const resReplays: NewReplay[] = replaysCopy.map((replay) => {
      const replayObj = replay as any;
      delete replayObj["settings"];
      delete replayObj["metadata"];
      replayObj.winnerIndices = JSON.stringify(replay.winnerIndices);
      return replayObj as NewReplay;
    });
    const replayInsert = await this.database.insertInto("replay").values(resReplays).executeTakeFirstOrThrow();
    if (replayInsert.insertId === undefined) {
      throw "db error";
    }
    const replayId = Number(replayInsert.insertId);

    // Insert GameStart data for replays
    const resSettings: NewReplayGameStart[] = settingsObjs.map((settings, index) => {
      const settingsObj = settings as any;
      delete settingsObj["players"];
      delete settingsObj["gameInfoBlock"];
      delete settingsObj["matchInfo"];
      settingsObj.isFrozenPS = Number(settings.isFrozenPS);
      settingsObj.isPAL = Number(settings.isPAL);
      settingsObj.isTeams = Number(settings.isTeams);
      settingsObj.friendlyFireEnabled = Number(settings.friendlyFireEnabled);
      settingsObj.replayId = replayId - replays.length + index + 1;
      return settingsObj as ReplayGameStart as NewReplayGameStart;
    });
    const settingsInsert = await this.database.insertInto("replay_game_start").values(resSettings).executeTakeFirst();
    if (settingsInsert.insertId === undefined) {
      throw "db error";
    }
    const settingsId = Number(settingsInsert.insertId);

    // Insert Player data for replays
    const resPlayers: NewReplayPlayer[] = playerObjs
      .map((players, index) => {
        const playersObj = players.map((player) => {
          const playerObj = player as any;
          playerObj.settingsId = settingsId - replays.length + index + 1;
          playerObj.staminaMode = Number(player.staminaMode);
          playerObj.silentCharacter = Number(player.silentCharacter);
          playerObj.lowGravity = Number(player.lowGravity);
          playerObj.invisible = Number(player.invisible);
          playerObj.blackStockIcon = Number(player.blackStockIcon);
          playerObj.metal = Number(player.metal);
          playerObj.startOnAngelPlatform = Number(player.startOnAngelPlatform);
          playerObj.rumbleEnabled = Number(player.rumbleEnabled);
          return player as NewReplayPlayer;
        });
        return playersObj as NewReplayPlayer[];
      })
      .flat();
    await this.database.insertInto("replay_player").values(resPlayers).executeTakeFirstOrThrow();

    // Insert Metadata for replays
    const resMetadata: NewReplayMetadata[] = metadataObjs.map((metadata, index) => {
      const metadataObj = metadata as any;
      metadataObj.replayId = replayId - replays.length + index + 1;
      delete metadataObj["players"];
      return metadataObj as NewReplayMetadata;
    });
    await this.database.insertInto("replay_metadata").values(resMetadata).executeTakeFirst();
  }
}
