import { viewSlpReplay } from "@dolphin/ipc";
import { ReplayQueueItem } from "@dolphin/types";
import { calculateGameStats, loadReplayFolder } from "@replays/ipc";
import { FileLoadResult, FileResult, FolderResult, Progress } from "@replays/types";
import { GameStartType, StatsType } from "@slippi/slippi-js";
import { produce } from "immer";
import path from "path";
import create from "zustand";

import { useSettings } from "@/lib/hooks/useSettings";

import { findChild, generateSubFolderTree } from "./folderTree";

type StoreState = {
  loading: boolean;
  progress: Progress | null;
  files: FileResult[];
  folders: FolderResult | null;
  currentRoot: string | null;
  currentFolder: string;
  fileErrorCount: number;
  scrollRowItem: number;
  selectedFiles: string[];
  selectedFile: {
    index: number | null;
    gameStats: StatsType | null;
    gameSettings: GameStartType | null;
    loading: boolean;
    error?: any;
  };
};

type StoreReducers = {
  init: (rootFolder: string, forceReload?: boolean, currentFolder?: string) => Promise<void>;
  selectFile: (index: number, filePath: string) => Promise<void>;
  playFiles: (files: ReplayQueueItem[]) => Promise<void>;
  clearSelectedFile: () => Promise<void>;
  removeFile: (filePath: string) => void;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath?: string, forceReload?: boolean) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
  setScrollRowItem: (offset: number) => void;
  updateProgress: (progress: Progress | null) => void;
  toggleSelectedFiles: (filePath: string) => void;
  clearSelectedFiles: () => void;
};

const initialState: StoreState = {
  loading: false,
  progress: null,
  files: [],
  folders: null,
  currentRoot: null,
  currentFolder: useSettings.getState().settings.rootSlpPath,
  fileErrorCount: 0,
  scrollRowItem: 0,
  selectedFiles: [],
  selectedFile: {
    index: null,
    gameStats: null,
    gameSettings: null,
    error: null,
    loading: false,
  },
};

export const useReplays = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  init: async (rootFolder, forceReload, currentFolder) => {
    const { currentRoot, loadFolder, loadDirectoryList } = get();
    if (currentRoot === rootFolder && !forceReload) {
      return;
    }

    set({
      currentRoot: rootFolder,
      folders: {
        name: path.basename(rootFolder),
        fullPath: rootFolder,
        subdirectories: [],
        collapsed: false,
      },
    });

    await Promise.all([loadDirectoryList(currentFolder ?? rootFolder), loadFolder(currentFolder ?? rootFolder, true)]);
  },

  playFiles: async (files: ReplayQueueItem[]) => {
    const viewResult = await viewSlpReplay.renderer!.trigger({ files });
    if (!viewResult.result) {
      console.error(`Error playing file(s): ${files.join(", ")}`, viewResult.errors);
      throw new Error(`Error playing file(s): ${files.join(", ")}`);
    }
  },

  selectFile: async (index, fullPath) => {
    if (get().selectedFile.loading) {
      console.warn("Alreading loading game stats for another file. Try again later.");
      return;
    }

    set({
      selectedFile: { index, gameStats: null, gameSettings: null, loading: true, error: null },
    });
    const { selectedFile } = get();
    const newSelectedFile = await produce(selectedFile, async (draft) => {
      try {
        const gameStats = await handleCalculatingGameStats(fullPath);
        draft.gameStats = gameStats;
      } catch (err) {
        draft.error = err;
      } finally {
        draft.loading = false;
      }
    });
    set({ selectedFile: newSelectedFile });
  },

  clearSelectedFile: async () => {
    set({
      selectedFile: {
        index: null,
        gameStats: null,
        gameSettings: null,
        error: null,
        loading: false,
      },
    });
  },

  removeFile: (filePath: string) => {
    set((state) =>
      produce(state, (draft) => {
        const index = draft.files.findIndex((f) => f.fullPath === filePath);
        // Modify the array in place
        draft.files.splice(index, 1);
      }),
    );
  },

  updateProgress: (progress: { current: number; total: number } | null) => {
    set({ progress });
  },

  loadFolder: async (childPath, forceReload) => {
    const { currentFolder, loading } = get();

    if (loading) {
      console.warn("A folder is already loading! Please wait for it to finish first.");
      return;
    }

    const folderToLoad = childPath ?? currentFolder;
    if (currentFolder === folderToLoad && !forceReload) {
      console.warn(`${currentFolder} is already loaded. Set forceReload to true to reload anyway.`);
      return;
    }

    set({ currentFolder: folderToLoad });

    set({ loading: true, progress: null });
    try {
      const result = await handleReplayFolderLoading(folderToLoad);
      set({
        scrollRowItem: 0,
        files: result.files,
        loading: false,
        fileErrorCount: result.fileErrorCount,
      });
    } catch (err) {
      set({ loading: false, progress: null });
    }
  },

  toggleFolder: (folder) => {
    set((state) =>
      produce(state, (draft) => {
        const currentTree = draft.folders;
        if (currentTree) {
          const child = findChild(currentTree, folder);
          if (child) {
            child.collapsed = !child.collapsed;
          }
        }
      }),
    );
  },

  loadDirectoryList: async (folder?: string) => {
    const { currentRoot, folders } = get();
    const rootSlpPath = useSettings.getState().settings.rootSlpPath;

    let currentTree = folders;
    if (currentTree === null || currentRoot !== rootSlpPath) {
      currentTree = {
        name: path.basename(rootSlpPath),
        fullPath: rootSlpPath,
        subdirectories: [],
        collapsed: false,
      };
    }

    const newFolders = await produce(currentTree, async (draft: FolderResult) => {
      const pathToLoad = folder ?? rootSlpPath;
      const child = findChild(draft, pathToLoad) ?? draft;
      const childPaths = path.relative(child.fullPath, pathToLoad);
      const childrenToExpand = childPaths ? childPaths.split(path.sep) : [];
      if (child && child.subdirectories.length === 0) {
        child.subdirectories = await generateSubFolderTree(child.fullPath, childrenToExpand);
      }
    });

    set({ folders: newFolders });
  },

  setScrollRowItem: (rowItem) => {
    set({ scrollRowItem: rowItem });
  },

  toggleSelectedFiles: (filePath: string) => {
    set((store) =>
      produce(store, (draft) => {
        const index = draft.selectedFiles.findIndex((f) => f === filePath);
        // We haven't selected it yet so push it on to the list
        if (index === -1) {
          draft.selectedFiles.push(filePath);
        } else {
          draft.selectedFiles.splice(index, 1);
        }
      }),
    );
  },

  clearSelectedFiles: () => {
    set({ selectedFiles: [] });
  },
}));

const handleReplayFolderLoading = async (folderPath: string): Promise<FileLoadResult> => {
  const loadFolderResult = await loadReplayFolder.renderer!.trigger({ folderPath });
  if (!loadFolderResult.result) {
    console.error(`Error loading folder: ${folderPath}`, loadFolderResult.errors);
    throw new Error(`Error loading folder: ${folderPath}`);
  }
  return loadFolderResult.result;
};

const handleCalculatingGameStats = async (filePath: string): Promise<StatsType | null> => {
  const statsResult = await calculateGameStats.renderer!.trigger({ filePath });
  if (!statsResult.result) {
    console.error(`Error calculating stats for: ${filePath}`, statsResult.errors);
    throw new Error(`Error calculating stats for: ${filePath}`);
  }
  return statsResult.result.stats;
};
