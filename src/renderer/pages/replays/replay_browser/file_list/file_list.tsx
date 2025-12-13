import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import type { FileResult } from "@replays/types";
import React from "react";
import { create } from "zustand";

import { IconMenu } from "@/components/icon_menu";

import { ReplayFileContainer } from "../replay_file/replay_file.container";
import { FileListMessages as Messages } from "./file_list.messages";

const LOAD_MORE_THRESHOLD = 5;

// Small hook to persist scroll position across component unmounts
const useScrollPosition = create<{
  scrollPixelOffset: number;
  setScrollPixelOffset: (offset: number) => void;
}>((set) => ({
  scrollPixelOffset: 0,
  setScrollPixelOffset: (offset: number) => set({ scrollPixelOffset: offset }),
}));

// This is the container for all the replays, rendering all items with infinite scroll
const FileListResults = ({
  folderPath,
  initialScrollOffset,
  files,
  onSelect,
  onPlay,
  onOpenMenu,
  onClick,
  onLoadMore,
  onScrollPositionChange,
  selectedFilesSet,
}: {
  folderPath: string;
  files: FileResult[];
  initialScrollOffset: number;
  onClick: (index: number, isShiftHeld: boolean) => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  onLoadMore: () => void;
  onScrollPositionChange: (rowIndex: number) => void;
  selectedFilesSet: Set<string>;
}) => {
  // Ref to the scrollable container element
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Track current scroll offset in pixels for saving on unmount
  const currentScrollOffset = React.useRef(initialScrollOffset);

  // Track filter values with ref to avoid re-renders
  const lastFilterRef = React.useRef({ folderPath });

  // Track if we're currently requesting more to prevent duplicate calls
  const isRequestingMore = React.useRef(false);
  const requestTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Restore initial scroll position
  React.useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = initialScrollOffset;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset scroll position when we change folders
  React.useEffect(() => {
    if (folderPath !== lastFilterRef.current.folderPath) {
      currentScrollOffset.current = 0;
      lastFilterRef.current.folderPath = folderPath;
      isRequestingMore.current = false;
      if (requestTimeout.current) {
        clearTimeout(requestTimeout.current);
        requestTimeout.current = null;
      }
      if (parentRef.current) {
        parentRef.current.scrollTop = 0;
      }
    }
  }, [folderPath]);

  // Check if we need to load more based on scroll position
  const checkLoadMore = React.useCallback(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) {
      return;
    }

    const scrollTop = scrollElement.scrollTop;
    const scrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight;

    // Trigger load more when within threshold of bottom (approximately LOAD_MORE_THRESHOLD items)
    const thresholdPixels = LOAD_MORE_THRESHOLD * 90; // Approximate item height

    if (scrolledToBottom < thresholdPixels && !isRequestingMore.current) {
      isRequestingMore.current = true;

      // Clear any existing timeout
      if (requestTimeout.current) {
        clearTimeout(requestTimeout.current);
      }

      // Reset the flag after a delay to allow the next request
      requestTimeout.current = setTimeout(() => {
        isRequestingMore.current = false;
      }, 500);

      onLoadMore();
    }
  }, [onLoadMore]);

  // Track scroll offset and trigger load more when approaching end
  React.useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      currentScrollOffset.current = scrollElement.scrollTop;
      checkLoadMore();
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [checkLoadMore]);

  // Check if we need to load more when files change (e.g., after loading)
  React.useEffect(() => {
    // Small delay to ensure the DOM has updated and loading state has settled
    const timer = setTimeout(() => {
      checkLoadMore();
    }, 100);
    return () => clearTimeout(timer);
  }, [files.length, checkLoadMore]);

  // Save scroll position when component unmounts
  React.useEffect(() => {
    return () => {
      onScrollPositionChange(currentScrollOffset.current);
      if (requestTimeout.current) {
        clearTimeout(requestTimeout.current);
      }
    };
  }, [onScrollPositionChange]);

  return (
    <div
      ref={parentRef}
      style={{
        height: "100%",
        width: "100%",
        overflow: "auto",
      }}
    >
      {files.map((file, index) => (
        <ReplayFileContainer
          key={file.fullPath}
          onOpenMenu={onOpenMenu}
          index={index}
          onSelect={onSelect}
          onClick={onClick}
          onPlay={onPlay}
          selectedFilesSet={selectedFilesSet}
          {...file}
        />
      ))}
    </div>
  );
};

// The container containing FileListResults and the context menu for file operations
export const FileList = React.memo(
  ({
    files,
    onSelect,
    onPlay,
    onDelete,
    onFileClick,
    folderPath,
    onLoadMore,
    selectedFilesSet,
  }: {
    folderPath: string;
    files: FileResult[];
    onDelete: (filepath: string) => void;
    onSelect: (index: number) => void;
    onFileClick: (index: number, isShiftHeld: boolean) => void;
    selectedFiles: Array<string>;
    selectedFilesSet: Set<string>;
    onPlay: (index: number) => void;
    onLoadMore: () => void;
    loadingMore: boolean;
  }) => {
    const [menuItem, setMenuItem] = React.useState<null | {
      index: number;
      anchorEl: HTMLElement;
    }>(null);

    // Read initial scroll position from store ONCE on mount (no subscription)
    // This persists scroll position across page navigation
    const initialScrollOffset = React.useRef(useScrollPosition.getState().scrollPixelOffset);

    // Callback to save scroll position to store (called on unmount)
    const handleScrollPositionChange = React.useCallback((pixelOffset: number) => {
      useScrollPosition.setState({ scrollPixelOffset: pixelOffset });
    }, []);

    const onOpenMenu = React.useCallback((index: number, target: any) => {
      setMenuItem({
        index,
        anchorEl: target,
      });
    }, []);

    const handleRevealLocation = React.useCallback(() => {
      if (menuItem) {
        window.electron.shell.showItemInFolder(files[menuItem.index].fullPath);
      }
      setMenuItem(null);
    }, [menuItem, files]);

    const handleDelete = React.useCallback(() => {
      if (menuItem) {
        onDelete(files[menuItem.index].fullPath);
      }
      setMenuItem(null);
    }, [menuItem, files, onDelete]);

    const handleClose = React.useCallback(() => {
      setMenuItem(null);
    }, []);

    return (
      <>
        <FileListResults
          folderPath={folderPath}
          onOpenMenu={onOpenMenu}
          onSelect={onSelect}
          onPlay={onPlay}
          onClick={onFileClick}
          files={files}
          initialScrollOffset={initialScrollOffset.current}
          onLoadMore={onLoadMore}
          onScrollPositionChange={handleScrollPositionChange}
          selectedFilesSet={selectedFilesSet}
        />
        <IconMenu
          anchorEl={menuItem ? menuItem.anchorEl : null}
          open={Boolean(menuItem)}
          onClose={handleClose}
          items={[
            {
              onClick: handleRevealLocation,
              icon: <FolderIcon fontSize="small" />,
              label: Messages.revealLocation(),
            },
            {
              onClick: handleDelete,
              icon: <DeleteIcon fontSize="small" />,
              label: Messages.delete(),
            },
          ]}
        />
      </>
    );
  },
);
