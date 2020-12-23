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
import { loadFolder } from "@/workers/fileLoader.worker";

type StoreState = {
  loaded: boolean;
  loading: boolean;
  progress: null | {
    current: number;
    total: number;
  };
  files: FileResult[];
  folders: FolderResult | null;
};

type StoreReducers = {
  loadRootFolder: () => Promise<void>;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath?: string) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
};

const initialState: StoreState = {
  loaded: false,
  loading: false,
  progress: null,
  files: [],
  folders: null,
};

export const useReplays = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  loadRootFolder: async () => {},

  loadFolder: async (childPath) => {
    if (get().loading) {
      // We should cancel the existing file load here
      // but for now just ignore the request.
      return;
    }

    set({ loading: true, progress: null });
    const { settings } = useSettings.getState();
    const folderToLoad = childPath ?? settings.rootSlpPath;
    try {
      const files = await loadFolder(
        folderToLoad,
        Comlink.proxy((current, total) => {
          set({ progress: { current, total } });
        })
      );
      set({ files });
    } catch (err) {
    } finally {
      set({ loading: false, progress: null });
    }
  },

  toggleFolder: (folder) => {
    console.log(`toggling: ${folder}`);
    set((state) =>
      produce(state, (draft) => {
        let currentTree = draft.folders;
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
