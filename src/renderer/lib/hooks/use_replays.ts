import type { FileResult, FolderResult, Progress, ReplayService } from "@replays/types";
import { useState } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { useSettings } from "@/lib/hooks/use_settings";
import { useServices } from "@/services";

import { useReplayBrowserList } from "./use_replay_browser_list";
import { buildReplayFilters, useReplayFilter } from "./use_replay_filter";

const REPLAY_BATCH_SIZE = 10;
const LAST_FOLDER_KEY = "replay-browser-last-folder";

/**
 * Get the initial folder to load in the replay browser.
 * Validates that the stored folder is still a subdirectory of one of the SLP paths.
 * Falls back to rootSlpPath if validation fails.
 */
const getInitialFolder = (): string => {
  const { rootSlpPath, extraSlpPaths } = useSettings.getState().settings;

  // Try to restore the last folder from localStorage
  const storedFolder = localStorage.getItem(LAST_FOLDER_KEY);

  if (storedFolder) {
    // Check if the stored folder is a subdirectory of any of the SLP paths
    const allSlpPaths = [rootSlpPath, ...extraSlpPaths];
    const isValid = allSlpPaths.some((slpPath) => {
      // A folder is valid if it equals the SLP path or is a subdirectory of it
      return storedFolder === slpPath || window.electron.utils.isSubdirectory(slpPath, storedFolder);
    });

    if (isValid) {
      return storedFolder;
    }
  }

  // Fall back to root SLP path if stored folder is invalid or doesn't exist
  return rootSlpPath;
};

type StoreState = {
  loading: boolean;
  loadingMore: boolean;
  progress: Progress | null;
  files: FileResult[];
  currentRoot: string | null;
  currentFolder: string;
  selectedFiles: string[];
  selectAllMode: boolean;
  deselectedFiles: string[]; // Files explicitly deselected from select-all mode
  totalFilesInFolder: number | null;
  folderTree: FolderResult[];
  collapsedFolders: string[];
  selectedFile: {
    index: number | null;
    total: number | null;
    fileResult: FileResult | null;
  };
  hasMoreReplays: boolean;
  continuation: string | undefined;
};

const initialState: StoreState = {
  loading: false,
  loadingMore: false,
  progress: null,
  files: [],
  folderTree: [],
  collapsedFolders: [],
  currentRoot: null,
  currentFolder: getInitialFolder(),
  selectedFiles: [],
  selectAllMode: false,
  deselectedFiles: [],
  totalFilesInFolder: null,
  selectedFile: {
    index: null,
    total: null,
    fileResult: null,
  },
  hasMoreReplays: false,
  continuation: undefined,
};

export const useReplays = create<StoreState>()(immer(() => initialState));

// Singleton instance of ReplayPresenter
let presenterInstance: ReplayPresenter | null = null;

export class ReplayPresenter {
  private currentLoadRequestId = 0;

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

  public removeFilesByIds(fileIds: string[]) {
    useReplays.setState((state) => {
      state.files = state.files.filter(({ id }) => !fileIds.includes(id));
    });
  }

  public updateProgress(progress: { current: number; total: number } | null) {
    useReplays.setState((state) => {
      state.progress = progress;
    });
  }

  public async loadFolder(childPath?: string, forceReload?: boolean): Promise<void> {
    // Increment request ID for this load operation
    const requestId = ++this.currentLoadRequestId;
    const { currentFolder } = useReplays.getState();

    const folderToLoad = childPath ?? currentFolder;

    // Persist the folder to localStorage for next session
    localStorage.setItem(LAST_FOLDER_KEY, folderToLoad);

    useReplays.setState((state) => {
      state.currentFolder = folderToLoad;
      state.selectedFiles = [];
      state.selectAllMode = false;
      state.deselectedFiles = [];
      state.loadingMore = false;
    });

    const loadFolderTree = async () => {
      const folderTree = await this.replayService.selectTreeFolder(folderToLoad);

      // Check if this request is still current before updating state
      if (this.currentLoadRequestId !== requestId) {
        return;
      }

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
        state.loadingMore = false;
        state.progress = null;
      });
      try {
        // Get current filter state
        const { sortBy, sortDirection, hideShortGames, searchText } = useReplayFilter.getState();

        // Build filters from current state
        const filters = buildReplayFilters(hideShortGames, searchText);

        // Use searchGames with pagination - load first batch
        const result = await this.replayService.searchGames({
          folderPath: folderToLoad,
          limit: REPLAY_BATCH_SIZE,
          orderBy: {
            field: sortBy === "DATE" ? "startTime" : "lastFrame",
            direction: sortDirection === "DESC" ? "desc" : "asc",
          },
          filters,
        });

        // Check if this request is still current before updating state
        if (this.currentLoadRequestId !== requestId) {
          return;
        }

        useReplays.setState((state) => {
          state.files = result.files;
          state.loading = false;
          state.continuation = result.continuation;
          state.hasMoreReplays = result.continuation !== undefined;
          state.totalFilesInFolder = result.totalCount ?? null;
        });
      } catch (err) {
        // Only update state if this is still the current request
        if (this.currentLoadRequestId === requestId) {
          useReplays.setState((state) => {
            state.loading = false;
            state.progress = null;
          });
        }
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

  public setSelectedFiles(filePaths: string[], resetSelectAllMode = true) {
    useReplays.setState((state) => {
      state.selectedFiles = filePaths;
      // Reset selectAllMode when manually changing selection
      if (resetSelectAllMode) {
        state.selectAllMode = false;
        state.deselectedFiles = [];
      }
    });
  }

  public setSelectAllMode(enabled: boolean) {
    useReplays.setState((state) => {
      state.selectAllMode = enabled;
      if (!enabled) {
        state.deselectedFiles = [];
      }
    });
  }

  public toggleFileInSelectAllMode(filePath: string) {
    useReplays.setState((state) => {
      const isDeselected = state.deselectedFiles.includes(filePath);
      if (isDeselected) {
        // Re-select the file (remove from deselected list)
        state.deselectedFiles = state.deselectedFiles.filter((f) => f !== filePath);
        // Also add to selectedFiles for immediate visual feedback
        if (!state.selectedFiles.includes(filePath)) {
          state.selectedFiles = [...state.selectedFiles, filePath];
        }
      } else {
        // Deselect the file (add to deselected list)
        state.deselectedFiles = [...state.deselectedFiles, filePath];
        // Remove from selectedFiles for immediate visual feedback
        state.selectedFiles = state.selectedFiles.filter((f) => f !== filePath);
      }
    });
  }

  public async loadMoreReplays(): Promise<void> {
    // Increment request ID for this load more operation
    const requestId = ++this.currentLoadRequestId;
    const { continuation, loadingMore, hasMoreReplays, currentFolder } = useReplays.getState();

    // Don't load more if already loading or no more replays
    if (loadingMore || !hasMoreReplays || !continuation) {
      return;
    }

    useReplays.setState((state) => {
      state.loadingMore = true;
    });

    try {
      // Get current filter state
      const { sortBy, sortDirection, hideShortGames, searchText } = useReplayFilter.getState();

      // Build filters from current state
      const filters = buildReplayFilters(hideShortGames, searchText);

      // Load next batch of replays
      const result = await this.replayService.searchGames({
        folderPath: currentFolder,
        limit: REPLAY_BATCH_SIZE,
        continuation,
        orderBy: {
          field: sortBy === "DATE" ? "startTime" : "lastFrame",
          direction: sortDirection === "DESC" ? "desc" : "asc",
        },
        filters,
      });

      // Check if this request is still current before updating state
      if (this.currentLoadRequestId !== requestId) {
        return;
      }

      useReplays.setState((state) => {
        state.files = [...state.files, ...result.files];
        state.continuation = result.continuation;
        state.hasMoreReplays = result.continuation !== undefined;
        state.loadingMore = false;

        // If in select-all mode, automatically add newly loaded files to selection
        // (unless they're in the deselected list)
        if (state.selectAllMode) {
          const deselectedSet = new Set(state.deselectedFiles);
          const newFilePaths = result.files.map((f) => f.fullPath).filter((path) => !deselectedSet.has(path));
          state.selectedFiles = [...state.selectedFiles, ...newFilePaths];
        }
      });
    } catch (err) {
      console.error("Failed to load more replays:", err);
      // Only update state if this is still the current request
      if (this.currentLoadRequestId === requestId) {
        useReplays.setState((state) => {
          state.loadingMore = false;
        });
      }
    }
  }
}

/**
 * Get the singleton instance of ReplayPresenter.
 * This ensures only one presenter instance exists across the entire application.
 */
export const getReplayPresenter = (replayService: ReplayService): ReplayPresenter => {
  if (!presenterInstance) {
    presenterInstance = new ReplayPresenter(replayService);
  }
  return presenterInstance;
};

/**
 * Hook to get the singleton ReplayPresenter instance.
 * Use this instead of creating new ReplayPresenter instances directly.
 */
export const useReplayPresenter = () => {
  const { replayService } = useServices();
  return getReplayPresenter(replayService);
};

export const useReplaySelection = () => {
  const presenter = useReplayPresenter();
  const { files } = useReplayBrowserList();
  const selectedFiles = useReplays((store) => store.selectedFiles);

  const [lastClickIndex, setLastClickIndex] = useState<number | null>(null);

  const toggleFiles = (fileNames: string[], mode: "toggle" | "select" | "deselect" = "toggle") => {
    const { selectAllMode } = useReplays.getState();

    // If in select-all mode, use the exclusion pattern
    if (selectAllMode) {
      fileNames.forEach((fileName) => {
        presenter.toggleFileInSelectAllMode(fileName);
      });
      return;
    }

    // Normal selection mode
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

    presenter.setSelectedFiles(newSelection);
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
    presenter.setSelectedFiles([], true); // Reset selectAllMode and deselectedFiles
  };

  const selectAll = () => {
    const currentlySelected = new Set(selectedFiles);
    const remainingFiles = files.filter((f) => !currentlySelected.has(f.fullPath)).map((f) => f.fullPath);

    // Preserve order: manually selected files first, then remaining files
    const allFiles = [...selectedFiles, ...remainingFiles];

    presenter.setSelectedFiles(allFiles, false); // Don't reset selectAllMode
    presenter.setSelectAllMode(true);
  };

  return {
    onFileClick,
    clearSelection,
    selectAll,
  };
};
