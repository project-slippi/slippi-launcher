import { chunk } from "@common/chunk";
import type { FileLoadResult, FileResult, Progress, ReplayProvider } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import { ReplayRepository } from "database/replay_repository";
import type { Database, NewReplay } from "database/schema";
import log from "electron-log";
import * as fs from "fs-extra";
import type { Kysely } from "kysely";
import path from "path";

import { loadFile } from "../file_system_replay_provider/load_file";
import { loadFolder } from "../file_system_replay_provider/load_folder";

export class DatabaseReplayProvider implements ReplayProvider {
  private database: Promise<Kysely<Database>>;

  constructor(createDatabase: () => Promise<Kysely<Database>>) {
    this.database = createDatabase();
  }

  public async init(): Promise<void> {
    await this.database;
  }
  public loadFile(filePath: string): Promise<FileResult> {
    return loadFile(filePath);
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

    await this.syncReplayDatabase(folder);

    const result = await loadFolder(folder, (current: number, total: number) => {
      onProgress?.({ current, total });
    });
    return result;
  }
  public calculateGameStats(_fullPath: string): Promise<StatsType | null> {
    throw new Error("Method not implemented.");
  }
  public calculateStadiumStats(_fullPath: string): Promise<StadiumStatsType | null> {
    throw new Error("Method not implemented.");
  }

  private async syncReplayDatabase(folder: string, onProgress?: (progress: Progress) => void, batchSize = 100) {
    const db = await this.database;
    const [fileResults, existingReplays] = await Promise.all([
      fs.readdir(folder, { withFileTypes: true }),
      ReplayRepository.findAllReplaysInFolder(db, folder),
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
        await ReplayRepository.deleteReplaysById(db, batch);
      }
    };

    // Find all new SLP files that are not yet in the database
    const insertNewReplays = async () => {
      const setOfExistingReplayNames = new Set(existingReplays.map((r) => r.file_name));
      const slpFilesToAdd = slpFileNames.filter((name) => !setOfExistingReplayNames.has(name));
      let replaysAdded = 0;
      const chunkedReplays = chunk(slpFilesToAdd, batchSize);
      for (const batch of chunkedReplays) {
        const newReplays = await Promise.all(
          batch.map(async (filename): Promise<NewReplay> => {
            let size = 0;
            let birthtime: string | null = null;
            try {
              const fileInfo = await fs.stat(filename);
              size = fileInfo.size;
              birthtime = fileInfo.birthtime.toISOString();
            } catch (err) {
              // Just ignore
            }
            return {
              file_name: filename,
              folder,
              size_bytes: size,
              birth_time: birthtime,
            };
          }),
        );
        await ReplayRepository.insertReplay(db, ...newReplays);
        replaysAdded += batchSize;
        onProgress?.({ current: replaysAdded, total: slpFilesToAdd.length });
      }
    };

    const [deleteResult, insertResult] = await Promise.allSettled([deleteOldReplays(), insertNewReplays()]);
    if (deleteResult.status === "rejected") {
      log.warn("Error removing deleted replays: " + deleteResult.reason);
    }
    if (insertResult.status === "rejected") {
      throw new Error("Error inserting new replays: " + insertResult.reason);
    }
  }
}
