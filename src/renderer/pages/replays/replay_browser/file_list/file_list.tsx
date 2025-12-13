import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import type { FileResult } from "@replays/types";
import React from "react";
import { create } from "zustand";

import { IconMenu } from "@/components/icon_menu";

import { ReplayFileContainer } from "../replay_file/replay_file.container";
import { FileListMessages as Messages } from "./file_list.messages";

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
  hasMoreReplays,
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
  hasMoreReplays: boolean;
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = React.useRef<HTMLDivElement>(null);
  const lastFolderRef = React.useRef(folderPath);
  const currentScrollOffsetRef = React.useRef(initialScrollOffset);

  // Restore scroll position on mount
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = initialScrollOffset;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset scroll position when folder changes
  React.useEffect(() => {
    if (folderPath !== lastFolderRef.current) {
      lastFolderRef.current = folderPath;
      currentScrollOffsetRef.current = 0;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [folderPath]);

  // Use Intersection Observer for performant infinite scroll
  React.useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // When the sentinel becomes visible, load more
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "200px", // Trigger 200px before reaching the sentinel
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore]);

  // Track scroll position and save on unmount
  React.useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      currentScrollOffsetRef.current = scrollElement.scrollTop;
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      onScrollPositionChange(currentScrollOffsetRef.current);
    };
  }, [onScrollPositionChange]);

  return (
    <div
      ref={scrollContainerRef}
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
      {/* Sentinel element for intersection observer - only render if there are more replays */}
      {hasMoreReplays && <div ref={loadMoreSentinelRef} style={{ height: "1px" }} />}
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
    hasMoreReplays,
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
    hasMoreReplays: boolean;
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
          hasMoreReplays={hasMoreReplays}
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
