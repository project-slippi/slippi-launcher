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
  loaded: boolean;
  loading: boolean;
  progress: null | {
    current: number;
    total: number;
  };
  files: FileResult[];
  folders: FolderResult | null;
  currentFolder: string;
  fileErrorCount: number;
};

type StoreReducers = {
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath?: string, forceReload?: boolean) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
};

const initialState: StoreState = {
  loaded: false,
  loading: false,
  progress: null,
  files: [],
  folders: null,
  currentFolder: useSettings.getState().settings.rootSlpPath,
  fileErrorCount: 0,
};

export const useReplays = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  loadFolder: async (childPath, forceReload) => {
    const { currentFolder, loaded } = get();
    const folderToLoad = childPath ?? currentFolder;
    if (currentFolder === folderToLoad) {
      // Just quit early if we're already loading or if we're not force reloading
      console.log("we're already loading or loaded this folder");
      console.log("force reload", forceReload);
      const { loading } = get();
      console.log("loading", loading);
      if ((loaded && !forceReload) || loading) {
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

    set({ loaded: false, loading: true, progress: null });
    try {
      const result = await loadFolder(
        folderToLoad,
        Comlink.proxy((current, total) => {
          set({ progress: { current, total } });
        })
      );
      set({
        loaded: true,
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
    const rootSlpPath = useSettings.getState().settings.rootSlpPath;
    const pathToLoad = folder ?? rootSlpPath;

    let currentTree = get().folders;
    if (currentTree === null) {
      currentTree = {
        name: path.basename(rootSlpPath),
        fullPath: rootSlpPath,
        subdirectories: [],
        collapsed: false,
      };
    }

    const newFolders = await produce(currentTree, async (draft) => {
      const child = findChild(draft, pathToLoad);
      if (child && child.subdirectories.length === 0) {
        child.subdirectories = await generateSubFolderTree(pathToLoad, []);
      }
    });

    set({ folders: newFolders });
  },
}));
