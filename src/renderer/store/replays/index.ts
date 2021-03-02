import { StatsType } from "@slippi/slippi-js";
import { deleteFolderReplays, loadReplayFile, loadReplays } from "common/replayBrowser/ReplayClient";
import { FileResult, FolderResult } from "common/types";
import { ipcRenderer, shell } from "electron";
import { ipcRenderer as ipc } from "electron-better-ipc";
import { produce } from "immer";
import path from "path";
import { unstable_batchedUpdates } from "react-dom";
import create from "zustand";

import { useSettings } from "../settings";
import { findChild, generateSubFolderTree } from "./folderTree";

type StoreState = {
  loading: boolean;
  progress: null | {
    current: number;
    total: number;
  };
  files: FileResult[];
  folders: FolderResult | null;
  currentRoot: string | null;
  currentFolder: string;
  fileErrorCount: number;
  scrollRowItem: number;
  selectedFile: {
    index: number | null;
    gameStats: StatsType | null;
    loading: boolean;
    error?: any;
  };
};

type StoreReducers = {
  init: (rootFolder: string, forceReload?: boolean, currentFolder?: string) => Promise<void>;
  selectFile: (index: number, filePath: string) => Promise<void>;
  playFile: (filePath: string) => Promise<void>;
  clearSelectedFile: () => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath?: string, forceReload?: boolean) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
  setScrollRowItem: (offset: number) => void;
  updateProgress: (progress: { current: number; total: number } | null) => void;
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
  selectedFile: {
    index: null,
    gameStats: null,
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

  playFile: async (fullPath) => {
    ipcRenderer.send("viewReplay", fullPath);
  },

  selectFile: async (index, fullPath) => {
    const file = await loadReplayFile(fullPath);
    if (file.stats) {
      set({
        selectedFile: { index, gameStats: file.stats, loading: false, error: null },
      });
    } else {
      set({
        selectedFile: { index, gameStats: file.stats, loading: false, error: "Stats could not be loaded" },
      });
    }
  },

  clearSelectedFile: async () => {
    set({
      selectedFile: {
        index: null,
        gameStats: null,
        error: null,
        loading: false,
      },
    });
  },

  deleteFile: async (filePath: string) => {
    set((state) =>
      produce(state, (draft) => {
        const index = draft.files.findIndex((f) => f.fullPath === filePath);
        if (index === -1) {
          console.warn(`Could not find ${filePath} in file list`);
          return;
        }

        const success = shell.moveItemToTrash(filePath);
        if (success) {
          // Modify the array in place
          draft.files.splice(index, 1);
        } else {
          console.warn(`Failed to delete ${filePath}`);
        }
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

    set({ currentFolder: folderToLoad, loading: true, progress: null });
    try {
      console.log("will load");
      const result = await loadReplays(folderToLoad, (count, total) =>
        set({ progress: { current: count, total: total } }),
      );
      set({
        scrollRowItem: 0,
        files: result.files,
        loading: false,
        fileErrorCount: result.fileErrorCount,
      });
    } catch (err) {
      console.log(err);
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

    const getFolderList = (root: FolderResult): string[] => {
      return [root.fullPath, ...root.subdirectories.flatMap((d) => getFolderList(d))];
    };

    try {
      const folders = getFolderList(newFolders);
      console.log("deleting where folder not in ", folders);
      await deleteFolderReplays(folders);
    } catch (err) {
      console.log(err);
    }

    set({ folders: newFolders });
  },

  setScrollRowItem: (rowItem) => {
    set({ scrollRowItem: rowItem });
  },
}));

// const loadReplayFolder = async (folder: string): Promise<FileLoadResult> => {
//   const res = await ipc.callMain<string, FileLoadResult>("loadReplayFolder", folder);
//   return res;
// };

// const calculateGameStats = async (file: string): Promise<StatsType> => {
//   const res = await ipc.callMain<string, StatsType>("calculateGameStats", file);
//   return res;
// };

// Listen to the replay folder progress event
ipc.on("loadReplayFolderProgress", (_, progress: { current: number; total: number }) => {
  unstable_batchedUpdates(() => {
    useReplays.getState().updateProgress(progress);
  });
});
