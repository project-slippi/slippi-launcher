import type {
  BulkDeleteOptions,
  BulkDeleteResult,
  FileResult,
  FolderResult,
  Progress,
  ReplayService,
  SearchGamesOptions,
  SearchGamesResult,
} from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";

import { delayAndMaybeError } from "../utils";
import { aMockFileResultWith, aMockFolderResultWith } from "./mocks";

const SHOULD_ERROR = false;

class MockReplayClient implements ReplayService {
  @delayAndMaybeError(SHOULD_ERROR)
  public async initializeFolderTree(folders: readonly string[]): Promise<readonly FolderResult[]> {
    return folders.map((folder) => aMockFolderResultWith(folder));
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async selectTreeFolder(folderPath: string): Promise<readonly FolderResult[]> {
    return ["foo", "bar", "baz"].map((name) => aMockFolderResultWith(folderPath, { name }));
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async searchGames(options: SearchGamesOptions): Promise<SearchGamesResult> {
    const folderPath = options.folderPath ?? "/default/folder";
    const files = [1, 2, 3, 4].map((i) => aMockFileResultWith(folderPath, { fileName: `Game${i}.slp` }));
    return {
      files,
      continuation: undefined,
    };
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async getAllFilePaths(options: SearchGamesOptions): Promise<string[]> {
    const folderPath = options.folderPath ?? "/default/folder";
    return [1, 2, 3, 4].map((i) => `${folderPath}/Game${i}.slp`);
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async calculateGameStats(_filePath: string): Promise<{ file: FileResult; stats: StatsType | null }> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async calculateStadiumStats(
    _filePath: string,
  ): Promise<{ file: FileResult; stadiumStats: StadiumStatsType | null }> {
    throw new Error("Method not implemented.");
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async deleteReplays(_fileIds: string[]): Promise<void> {
    return;
  }

  @delayAndMaybeError(SHOULD_ERROR)
  public async bulkDeleteReplays(_options: BulkDeleteOptions): Promise<BulkDeleteResult> {
    return { deletedCount: 4 };
  }

  public onReplayLoadProgressUpdate(_handle: (progress: Progress) => void): () => void {
    return () => void 0;
  }

  public onStatsPageRequest(_handle: (filePath: string) => void): () => void {
    return () => void 0;
  }
}

export default function createMockReplayClient(): ReplayService {
  return new MockReplayClient();
}
