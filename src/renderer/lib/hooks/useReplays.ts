import { ipc_loadReplayFolder } from "@replays/ipc";
import { FileLoadResult, FileResult, FolderResult, Progress } from "@replays/types";
import { produce } from "immer";
import path from "path";
import { useState } from "react";
import create from "zustand";

import { useSettings } from "@/lib/hooks/useSettings";

import { findChild, generateSubFolderTree } from "../folderTree";
import { useReplayBrowserList } from "./useReplayBrowserList";

type StoreState = {
  loading: boolean;
  progress: Progress | null;
  files: FileResult[];
  netplaySlpFolder: FolderResult | null;
  extraFolders: FolderResult[];
  currentRoot: string | null;
  currentFolder: string;
  fileErrorCount: number;
  scrollRowItem: number;
  selectedFiles: string[];
  selectedFile: {
    index: number | null;
    total: number | null;
    fileResult: FileResult | null;
  };
};

type StoreReducers = {
  init: (rootFolder: string, extraFolders: string[], forceReload?: boolean, currentFolder?: string) => Promise<void>;
  selectFile: (file: FileResult, index?: number | null, total?: number | null) => void;
  clearSelectedFile: () => void;
  removeFile: (filePath: string) => void;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath?: string, forceReload?: boolean) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
  setScrollRowItem: (offset: number) => void;
  updateProgress: (progress: Progress | null) => void;
  setSelectedFiles: (filePaths: string[]) => void;
};

const initialState: StoreState = {
  loading: false,
  progress: null,
  files: [],
  netplaySlpFolder: null,
  extraFolders: [],
  currentRoot: null,
  currentFolder: useSettings.getState().settings.rootSlpPath,
  fileErrorCount: 0,
  scrollRowItem: 0,
  selectedFiles: [],
  selectedFile: {
    index: null,
    total: null,
    fileResult: null,
  },
};

export const useReplays = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  init: async (rootFolder, extraFolders, forceReload, currentFolder) => {
    const { currentRoot, loadFolder, loadDirectoryList } = get();
    if (currentRoot === rootFolder && !forceReload) {
      return;
    }

    set({
      currentRoot: rootFolder,
      netplaySlpFolder: {
        name: path.basename(rootFolder),
        fullPath: rootFolder,
        subdirectories: [],
        collapsed: false,
      },
      extraFolders: extraFolders.filter(Boolean).map(
        (folder) =>
          ({
            name: path.basename(folder),
            fullPath: folder,
            subdirectories: [],
            collapsed: true,
          } as FolderResult),
      ),
    });

    await Promise.all([loadDirectoryList(currentFolder ?? rootFolder), loadFolder(currentFolder ?? rootFolder, true)]);
  },

  selectFile: (file, index = null, total = null) => {
    set({
      selectedFile: { fileResult: file, index, total },
    });
  },

  clearSelectedFile: () => {
    set({
      selectedFile: {
        fileResult: null,
        index: null,
        total: null,
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

    set({ currentFolder: folderToLoad, selectedFiles: [] });

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
        const currentTree = [draft.netplaySlpFolder, ...draft.extraFolders];
        if (currentTree) {
          currentTree.some((parent) => {
            if (!parent) {
              return false;
            }
            const child = findChild(parent, folder);
            if (child) {
              child.collapsed = !child.collapsed;
              return true;
            }
            return false;
          });
        }
      }),
    );
  },

  loadDirectoryList: async (folder?: string) => {
    const { currentRoot, netplaySlpFolder: folders, extraFolders } = get();
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

    const newExtraFolders = await Promise.all(
      extraFolders.map(async (rootFolder) => {
        const newFolders = await produce(rootFolder, async (draft: FolderResult) => {
          const pathToLoad = folder ?? rootSlpPath;
          const child = findChild(draft, pathToLoad) ?? draft;
          const childPaths = path.relative(child.fullPath, pathToLoad);
          const childrenToExpand = childPaths ? childPaths.split(path.sep) : [];
          if (child && child.subdirectories.length === 0) {
            child.subdirectories = await generateSubFolderTree(child.fullPath, childrenToExpand);
          }
        });
        return newFolders;
      }),
    );

    set({ netplaySlpFolder: newFolders });
    set({ extraFolders: newExtraFolders });
  },

  setScrollRowItem: (rowItem) => {
    set({ scrollRowItem: rowItem });
  },

  setSelectedFiles: (filePaths: string[]) => {
    set({ selectedFiles: filePaths });
  },
}));

const handleReplayFolderLoading = async (folderPath: string): Promise<FileLoadResult> => {
  const loadFolderResult = await ipc_loadReplayFolder.renderer!.trigger({ folderPath });
  if (!loadFolderResult.result) {
    console.error(`Error loading folder: ${folderPath}`, loadFolderResult.errors);
    throw new Error(`Error loading folder: ${folderPath}`);
  }
  return loadFolderResult.result;
};

export const useReplaySelection = () => {
  const { files } = useReplayBrowserList();
  const selectedFiles = useReplays((store) => store.selectedFiles);
  const setSelectedFiles = useReplays((store) => store.setSelectedFiles);

  const [lastClickIndex, setLastClickIndex] = useState<number | null>(null);

  const toggleFiles = (fileNames: string[], mode: "toggle" | "select" | "deselect" = "toggle") => {
    const newSelection = Array.from(selectedFiles);

    fileNames.forEach((fileName) => {
      const alreadySelectedIndex = newSelection.findIndex((f) => f === fileName);
      switch (mode) {
        case "toggle": {
          if (alreadySelectedIndex !== -1) {
            newSelection.splice(alreadySelectedIndex, 1);
          } else {
            newSelection.push(fileName);
          }
          break;
        }
        case "select": {
          if (alreadySelectedIndex === -1) {
            newSelection.push(fileName);
          }
          break;
        }
        case "deselect": {
          if (alreadySelectedIndex !== -1) {
            newSelection.splice(alreadySelectedIndex, 1);
          }
          break;
        }
      }
    });

    setSelectedFiles(newSelection);
  };

  const onFileClick = (index: number, isShiftHeld: boolean) => {
    const isCurrentSelected = selectedFiles.includes(files[index].fullPath);
    if (lastClickIndex !== null && isShiftHeld) {
      // Shift is held
      // Find all the files between the last clicked file and the current one
      const startIndex = Math.min(index, lastClickIndex);
      const endIndex = Math.max(index, lastClickIndex);

      const filesToToggle: string[] = [];
      for (let i = startIndex; i <= endIndex; i++) {
        filesToToggle.push(files[i].fullPath);
      }

      if (lastClickIndex > index) {
        filesToToggle.reverse();
      }

      if (isCurrentSelected) {
        toggleFiles(filesToToggle, "deselect");
      } else {
        toggleFiles(filesToToggle, "select");
      }
    } else {
      toggleFiles([files[index].fullPath]);
    }

    // Update the click index when we're done
    setLastClickIndex(index);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const selectAll = () => {
    setSelectedFiles(files.map((f) => f.fullPath));
  };

  return {
    onFileClick,
    clearSelection,
    selectAll,
  };
};
