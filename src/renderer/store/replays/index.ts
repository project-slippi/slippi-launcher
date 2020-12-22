import produce from "immer";
import path from "path";
import create from "zustand";

import { useSettings } from "../settings";
import {
  findChild,
  FolderResult,
  generateSubFolderTree,
} from "@/lib/replayBrowser";

type StoreState = {
  loaded: boolean;
  loading: null | {
    current: number;
    total: number;
  };
  folders: FolderResult | null;
};

type StoreReducers = {
  loadRootFolder: () => Promise<void>;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath: string) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
};

const initialState: StoreState = {
  loaded: false,
  loading: null,
  folders: null,
};

export const useReplays = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  loadRootFolder: async () => {},

  loadFolder: async (folder) => {
    // const { settings } = useSettings.getState();
    // try {
    //   await loadFolder(settings.rootSlpPath, (current, total) => {
    //     set({ loading: { current, total } });
    //   });
    // } catch (err) {
    // } finally {
    //   set({ loading: null });
    // }
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
