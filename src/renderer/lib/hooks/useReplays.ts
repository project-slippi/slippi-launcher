import type { FileLoadResult, FileResult, FolderResult, Progress } from "@replays/types";
import { produce } from "immer";
import { useState } from "react";
import create from "zustand";

import { useSettings } from "@/lib/hooks/useSettings";

import { useReplayBrowserList } from "./useReplayBrowserList";

type StoreState = {
  loading: boolean;
  progress: Progress | null;
  files: FileResult[];
  totalBytes: number | null;
  currentRoot: string | null;
  currentFolder: string;
  fileErrorCount: number;
  scrollRowItem: number;
  selectedFiles: string[];
  folderTree: readonly FolderResult[];
  collapsedFolders: readonly string[];
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
  removeFiles: (filePaths: string[]) => void;
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
  totalBytes: null,
  folderTree: [],
  collapsedFolders: [],
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
    const { currentRoot, loadFolder } = get();
    if (currentRoot === rootFolder && !forceReload) {
      return;
    }

    const loadFolderList = async () => {
      const folders = [rootFolder, ...extraFolders];
      // Init the folder tree
      await window.electron.replays.initializeFolderTree(folders);

      // Get the result after folder selection
      const folderTree = await window.electron.replays.selectTreeFolder(currentFolder ?? rootFolder);

      set({
        currentRoot: rootFolder,
        folderTree,
        collapsedFolders: [],
      });
    };

    await Promise.all([loadFolderList(), loadFolder(currentFolder ?? rootFolder, true)]);
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

  removeFiles: (filePaths: string[]) => {
    set((state) =>
      produce(state, (draft) => {
        draft.files = draft.files.filter(({ fullPath }) => !filePaths.includes(fullPath));
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
    set({ currentFolder: folderToLoad, selectedFiles: [] });

    const loadFolderTree = async () => {
      const folderTree = await window.electron.replays.selectTreeFolder(folderToLoad);
      set({ folderTree });
    };

    const loadFolderDetails = async () => {
      if (currentFolder === folderToLoad && !forceReload) {
        console.warn(`${currentFolder} is already loaded. Set forceReload to true to reload anyway.`);
        return;
      }

      set({ loading: true, progress: null });
      try {
        const result = await handleReplayFolderLoading(folderToLoad);
        set({
          scrollRowItem: 0,
          files: result.files,
          loading: false,
          fileErrorCount: result.fileErrorCount,
          totalBytes: result.totalBytes,
        });
      } catch (err) {
        set({ loading: false, progress: null });
      }
    };

    await Promise.all([loadFolderTree(), loadFolderDetails()]);
  },

  toggleFolder: (folder) => {
    set((state) =>
      produce(state, (draft) => {
        if (draft.collapsedFolders.includes(folder)) {
          draft.collapsedFolders = draft.collapsedFolders.filter((f) => f !== folder);
        } else {
          draft.collapsedFolders = [...draft.collapsedFolders, folder];
        }
      }),
    );
  },

  setScrollRowItem: (rowItem) => {
    set({ scrollRowItem: rowItem });
  },

  setSelectedFiles: (filePaths: string[]) => {
    set({ selectedFiles: filePaths });
  },
}));

const handleReplayFolderLoading = async (folderPath: string): Promise<FileLoadResult> => {
  return window.electron.replays.loadReplayFolder(folderPath);
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
