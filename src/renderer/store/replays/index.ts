import { StatsType } from "@slippi/slippi-js";
import * as Comlink from "comlink";
import { FileResult, findChild, FolderResult, generateSubFolderTree } from "common/replayBrowser";
import { shell } from "electron";
import produce from "immer";
import path from "path";
import create from "zustand";

import { loadReplayFolder } from "@/workers/fileLoader.worker";
import { calculateGameStats } from "@/workers/gameStats.worker";

import { useSettings } from "../settings";
import { ReplayCommunication, startReplay } from "@/lib/startDolphin";

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
    const replayComm: ReplayCommunication = {
      replay: fullPath,
      mode: "normal",
    };
    const meleeIsoPath = useSettings.getState().settings.isoPath || undefined;
    startReplay(console.log, replayComm, meleeIsoPath);
  },

  selectFile: async (index, fullPath) => {
    if (get().selectedFile.loading) {
      console.warn("Alreading loading game stats for another file. Try again later.");
      return;
    }

    set({
      selectedFile: { index, gameStats: null, loading: true, error: null },
    });
    const { selectedFile } = get();
    const newSelectedFile = await produce(selectedFile, async (draft) => {
      try {
        const gameStats = await calculateGameStats(fullPath);
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
      const result = await loadReplayFolder(
        folderToLoad,
        Comlink.proxy((current, total) => {
          set({ progress: { current, total } });
        }),
      );
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
}));
