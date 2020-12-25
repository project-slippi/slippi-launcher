import produce from "immer";
import path from "path";
import create from "zustand";

import { useSettings } from "../settings";
import {
  FileResult,
  findChild,
  FolderResult,
  generateSubFolderTree,
} from "common/replayBrowser";
import * as Comlink from "comlink";
import { loadFolder, abortFolderLoad } from "@/workers/fileLoader.worker";

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
};

type StoreReducers = {
  init: (
    rootFolder: string,
    forceReload?: boolean,
    currentFolder?: string
  ) => Promise<void>;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath?: string, forceReload?: boolean) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
};

const initialState: StoreState = {
  loading: false,
  progress: null,
  files: [],
  folders: null,
  currentRoot: null,
  currentFolder: useSettings.getState().settings.rootSlpPath,
  fileErrorCount: 0,
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

    await Promise.all([
      loadDirectoryList(currentFolder ?? rootFolder),
      loadFolder(currentFolder ?? rootFolder, true),
    ]);
  },

  loadFolder: async (childPath, forceReload) => {
    const { currentFolder } = get();
    const folderToLoad = childPath ?? currentFolder;
    if (currentFolder === folderToLoad) {
      // Just quit early if we're already loading or if we're not force reloading
      console.log("we're already loading or loaded this folder");
      console.log("force reload", forceReload);
      const { loading } = get();
      console.log("loading", loading);
      if (!forceReload || loading) {
        console.log("bailing early...");
        return;
      } else {
        console.log(`loading the ${folderToLoad} anyway`);
      }
    }

    set({ currentFolder: folderToLoad });

    if (get().loading) {
      await abortFolderLoad();
    }

    set({ loading: true, progress: null });
    try {
      const result = await loadFolder(
        folderToLoad,
        Comlink.proxy((current, total) => {
          set({ progress: { current, total } });
        })
      );
      set({
        files: result.files,
        loading: result.aborted,
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
      })
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

    const newFolders = await produce(
      currentTree,
      async (draft: FolderResult) => {
        const pathToLoad = folder ?? rootSlpPath;
        const child = findChild(draft, pathToLoad) ?? draft;
        const childPaths = path.relative(child.fullPath, pathToLoad);
        const childrenToExpand = childPaths ? childPaths.split(path.sep) : [];
        if (child && child.subdirectories.length === 0) {
          child.subdirectories = await generateSubFolderTree(
            child.fullPath,
            childrenToExpand
          );
        }
      }
    );

    set({ folders: newFolders });
  },
}));
