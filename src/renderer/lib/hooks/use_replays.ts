import type { FileResult, FolderResult, Progress, ReplayService } from "@replays/types";
import { useRef, useState } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { useSettings } from "@/lib/hooks/use_settings";
import { useServices } from "@/services";

import { useReplayBrowserList } from "./use_replay_browser_list";

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
  folderTree: FolderResult[];
  collapsedFolders: string[];
  selectedFile: {
    index: number | null;
    total: number | null;
    fileResult: FileResult | null;
  };
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

export const useReplays = create<StoreState>()(immer(() => initialState));

export class ReplayPresenter {
  constructor(private readonly replayService: ReplayService) {}

  public async init(
    rootFolder: string,
    extraFolders: string[],
    forceReload?: boolean,
    currentFolder?: string,
  ): Promise<void> {
    const { currentRoot } = useReplays.getState();
    if (currentRoot === rootFolder && !forceReload) {
      return;
    }

    const loadFolderList = async () => {
      const folders = [rootFolder, ...extraFolders];
      // Init the folder tree
      await this.replayService.initializeFolderTree(folders);

      // Get the result after folder selection
      const folderTree = await this.replayService.selectTreeFolder(currentFolder ?? rootFolder);

      useReplays.setState((state) => {
        state.currentRoot = rootFolder;
        state.folderTree = [...folderTree];
        state.collapsedFolders = [];
      });
    };

    await Promise.all([loadFolderList(), this.loadFolder(currentFolder ?? rootFolder, true)]);
  }

  public selectFile(file: FileResult, index: number | null = null, total: number | null = null): void {
    useReplays.setState((state) => {
      state.selectedFile = { fileResult: file, index, total };
    });
  }

  public clearSelectedFile() {
    useReplays.setState((state) => {
      state.selectedFile = {
        fileResult: null,
        index: null,
        total: null,
      };
    });
  }

  public removeFiles(filePaths: string[]) {
    useReplays.setState((state) => {
      state.files = state.files.filter(({ fullPath }) => !filePaths.includes(fullPath));
    });
  }

  public updateProgress(progress: { current: number; total: number } | null) {
    useReplays.setState((state) => {
      state.progress = progress;
    });
  }

  public async loadFolder(childPath?: string, forceReload?: boolean): Promise<void> {
    const { currentFolder, loading } = useReplays.getState();

    if (loading) {
      console.warn("A folder is already loading! Please wait for it to finish first.");
      return;
    }

    const folderToLoad = childPath ?? currentFolder;
    useReplays.setState((state) => {
      state.currentFolder = folderToLoad;
      state.selectedFiles = [];
    });

    const loadFolderTree = async () => {
      const folderTree = await this.replayService.selectTreeFolder(folderToLoad);
      useReplays.setState((state) => {
        state.folderTree = [...folderTree];
      });
    };

    const loadFolderDetails = async () => {
      if (currentFolder === folderToLoad && !forceReload) {
        console.warn(`${currentFolder} is already loaded. Set forceReload to true to reload anyway.`);
        return;
      }

      useReplays.setState((state) => {
        state.loading = true;
        state.progress = null;
      });
      try {
        const result = await this.replayService.loadReplayFolder(folderToLoad);
        useReplays.setState((state) => {
          state.scrollRowItem = 0;
          state.files = result.files;
          state.loading = false;
          state.fileErrorCount = result.fileErrorCount;
          state.totalBytes = result.totalBytes;
        });
      } catch (err) {
        useReplays.setState((state) => {
          state.loading = false;
          state.progress = null;
        });
      }
    };
    await Promise.all([loadFolderTree(), loadFolderDetails()]);
  }

  public toggleFolder(folder: string) {
    useReplays.setState((state) => {
      if (state.collapsedFolders.includes(folder)) {
        state.collapsedFolders = state.collapsedFolders.filter((f) => f !== folder);
      } else {
        state.collapsedFolders = [...state.collapsedFolders, folder];
      }
    });
  }

  public setScrollRowItem(rowItem: number) {
    useReplays.setState((state) => {
      state.scrollRowItem = rowItem;
    });
  }

  public setSelectedFiles(filePaths: string[]) {
    useReplays.setState((state) => {
      state.selectedFiles = filePaths;
    });
  }
}

export const useReplaySelection = () => {
  const { replayService } = useServices();
  const presenter = useRef(new ReplayPresenter(replayService));
  const { files } = useReplayBrowserList();
  const selectedFiles = useReplays((store) => store.selectedFiles);

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

    presenter.current.setSelectedFiles(newSelection);
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
    presenter.current.setSelectedFiles([]);
  };

  const selectAll = () => {
    presenter.current.setSelectedFiles(files.map((f) => f.fullPath));
  };

  return {
    onFileClick,
    clearSelection,
    selectAll,
  };
};
