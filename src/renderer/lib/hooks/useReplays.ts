import { ipc_loadReplayFolder, ipc_loadReplayFiles } from "@replays/ipc";
import { FileLoadComplete, FileLoadError, FileResult, FolderResult, FolderLoadResult, Progress } from "@replays/types";
import { produce, setAutoFreeze } from "immer";
import path from "path";
import { useState } from "react";
import create from "zustand";

import { useReplayBrowserList } from "@/lib/hooks/useReplayBrowserList";
import { useReplayFilter } from "@/lib/hooks/useReplayFilter";
import { useSettings } from "@/lib/hooks/useSettings";

import { findChild, generateSubFolderTree } from "../folderTree";
import { replayFileSort } from "../replayFileSort";

// Necessary because freezing the state causes errors in loadFiles.
setAutoFreeze(false);

type StoreState = {
  loading: boolean;
  progress: Progress | null;
  files: Map<string, FileResult>;
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
  // Can be incremented to force ReplayBrowser to re-render. This is useful
  // because we can significantly improve performance by updating files in place
  // (without copying the map), but this will not normally trigger a render
  // because React does not recognize it as a state change.
  forceRender: number;
};

type StoreReducers = {
  init: (rootFolder: string, extraFolders: string[], forceReload?: boolean, currentFolder?: string) => Promise<void>;
  selectFile: (file: FileResult, index?: number | null, total?: number | null) => void;
  clearSelectedFile: () => void;
  removeFile: (filePath: string) => void;
  loadDirectoryList: (folder: string) => Promise<void>;
  loadFolder: (childPath?: string, forceReload?: boolean) => Promise<void>;
  loadFiles: (results: Map<string, FileResult>) => Promise<void>;
  toggleFolder: (fullPath: string) => void;
  setScrollRowItem: (offset: number) => void;
  updateProgress: (progress: Progress | null) => void;
  updateFileDetails: (fileLoadComplete: FileLoadComplete) => void;
  updateFileLoadError: (fileLoadError: FileLoadError) => void;
  setSelectedFiles: (filePaths: string[]) => void;
};

const initialState: StoreState = {
  loading: false,
  progress: null,
  files: new Map(),
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
  forceRender: 0,
};

// Subset of StoreState that is allowed to be modified in this function.
type LoadFilesState = {
  files: Map<string, FileResult>;
  fileErrorCount: number;
};

export const useReplays = create<StoreState & StoreReducers>((set, get) => {
  // Every time we update the files state with details an expensive rerender is
  // triggered, and React will not batch these state changes. Therefore we
  // use this utility to batch state changes manually.
  const batcher = (() => {
    // This parameter balances the responsiveness of the replays list versus the
    // total loading time. A smaller value will update the list more frequency,
    // but will delay further loads while the list is re-rendered.
    const UPDATE_BATCH_SIZE = 1000;

    // Making the first batch smaller improves the perceived responsiveness.
    // This value is chosen to be slightly larger than the likely first page
    // size.
    const FIRST_BATCH_SIZE = 20;

    let state: LoadFilesState = { files: new Map(), fileErrorCount: 0 };
    let thisFolder = "";
    let finalSize = 0;
    let id = 0;

    let batchSize = UPDATE_BATCH_SIZE - FIRST_BATCH_SIZE;
    let totalSize = 0;

    const reset = (finalSize_: number) => {
      const indexState = get();
      state = { files: indexState.files, fileErrorCount: indexState.fileErrorCount };
      thisFolder = indexState.currentFolder;
      finalSize = finalSize_;
      id++;

      batchSize = UPDATE_BATCH_SIZE - FIRST_BATCH_SIZE;
      totalSize = 0;
    };

    const flush = () => {
      // The current folder may change while we are loading files. If it does
      // so, ignore state changes.
      if (get().currentFolder == thisFolder) {
        set((oldState) => ({ ...state, forceRender: oldState.forceRender + 1 }));
        batchSize = 0;
      }
    };

    const setState = (batcherId: number, updateFn: (state: LoadFilesState) => Partial<LoadFilesState>) => {
      // The directory may have changed while files were loading. If this
      // happened the batcherId will be updated, and we will want to ignore
      // events from the old directory.
      if (batcherId !== id) {
        return;
      }
      Object.assign(state, updateFn(state));
      batchSize++;
      totalSize++;
      if (batchSize >= UPDATE_BATCH_SIZE || totalSize == finalSize) {
        flush();
      }
    };

    const getId = () => {
      return id;
    };

    return {
      reset: reset,
      setState: setState,
      getId: getId,
    };
  })();

  return {
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

      await Promise.all([
        loadDirectoryList(currentFolder ?? rootFolder),
        loadFolder(currentFolder ?? rootFolder, true),
      ]);
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
          // Modify the array in place
          draft.files.delete(filePath);
        }),
      );
    },

    updateProgress: (progress: { current: number; total: number } | null) => {
      set({ progress });
    },

    loadFolder: async (childPath, forceReload) => {
      const { currentFolder, loading, loadFiles } = get();

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
        const newFiles = new Map(result.files.map((header) => [header.fullPath, { header: header, details: null }]));
        set({
          scrollRowItem: 0,
          files: newFiles,
          loading: false,
          fileErrorCount: result.fileErrorCount,
        });
        await loadFiles(newFiles);
      } catch (err) {
        console.warn(err);
        set({ loading: false, progress: null });
      }
    },

    updateFileDetails: (fileLoadComplete: FileLoadComplete) => {
      batcher.setState(fileLoadComplete.batcherId, (state) => {
        if (!state.files.has(fileLoadComplete.path)) {
          console.error("File misssing (this should not happen).");
          return {};
        } else {
          state.files.get(fileLoadComplete.path)!.details = fileLoadComplete.details;
          return { files: state.files };
        }
      });
    },

    updateFileLoadError: (fileLoadError: FileLoadError) => {
      batcher.setState(fileLoadError.batcherId, (state) => {
        if (!state.files.has(fileLoadError.path)) {
          console.error("File misssing (this should not happen).");
          return {};
        } else {
          console.warn(fileLoadError.error);
          state.files.delete(fileLoadError.path);
          return {
            fileErrorCount: state.fileErrorCount + 1,
            files: state.files,
          };
        }
      });
    },

    loadFiles: async (results: Map<string, FileResult>) => {
      // Sort headers so files will load in approximately display order (nothing
      // will be filtered at this point since details are empty).
      const sortedHeaders = Array.from(results, ([_, result]) => result)
        .sort(replayFileSort(useReplayFilter.getState().sortBy, useReplayFilter.getState().sortDirection))
        .map((result) => result.header);

      batcher.reset(sortedHeaders.length);

      await ipc_loadReplayFiles.renderer!.trigger({
        fileHeaders: sortedHeaders,
        batcherId: batcher.getId(),
      });
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
  };
});

const handleReplayFolderLoading = async (folderPath: string): Promise<FolderLoadResult> => {
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
    const isCurrentSelected = selectedFiles.includes(files[index].header.fullPath);
    if (lastClickIndex !== null && isShiftHeld) {
      // Shift is held
      // Find all the files between the last clicked file and the current one
      const startIndex = Math.min(index, lastClickIndex);
      const endIndex = Math.max(index, lastClickIndex);

      const filesToToggle: string[] = [];
      for (let i = startIndex; i <= endIndex; i++) {
        filesToToggle.push(files[i].header.fullPath);
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
      toggleFiles([files[index].header.fullPath]);
    }

    // Update the click index when we're done
    setLastClickIndex(index);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const selectAll = () => {
    setSelectedFiles(files.map((f) => f.header.fullPath));
  };

  return {
    onFileClick,
    clearSelection,
    selectAll,
  };
};
