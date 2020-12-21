import produce from "immer";
import path from "path";
import create from "zustand";

import { useSettings } from "../settings";
import { FolderResult, generateSubFolderTree } from "@/lib/replayBrowser";

type StoreState = {
  loaded: boolean;
  loading: null | {
    current: number;
    total: number;
  };
  folders: FolderResult | null;
  loadingFolders: boolean;
};

type StoreReducers = {
  loadRootFolder: () => Promise<void>;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath: string) => Promise<void>;
};

const initialState: StoreState = {
  loaded: false,
  loading: null,
  folders: null,
  loadingFolders: false,
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

  loadDirectoryList: async (folder?: string) => {
    set({ loadingFolders: true });

    const rootSlpPath = useSettings.getState().settings.rootSlpPath;
    const relativePath = path.relative(rootSlpPath, folder || rootSlpPath);
    // The child paths to expand
    const pathMap = relativePath ? relativePath.split(path.sep) : [];

    let currentTree = get().folders;
    if (currentTree === null) {
      currentTree = {
        name: path.basename(rootSlpPath),
        fullPath: rootSlpPath,
        subdirectories: [],
      };
    } else if (pathMap.length === 0) {
      // We've loaded the root path already so just return
      return;
    }

    const newFolders = await produce(currentTree, async (draft) => {
      let currentChild = draft;

      const foundChildSegments: string[] = [];
      while (pathMap.length > 0) {
        const nextChildIndex = currentChild.subdirectories.findIndex(
          (dir) => dir.name === pathMap[0]
        );
        if (nextChildIndex === -1) {
          break;
        }
        currentChild = currentChild.subdirectories[nextChildIndex];
        foundChildSegments.push(pathMap.shift() as string);
      }

      currentChild.subdirectories = await generateSubFolderTree(
        path.join(rootSlpPath, ...foundChildSegments),
        pathMap
      );
    });

    set({ folders: newFolders, loadingFolders: false });
  },
}));
