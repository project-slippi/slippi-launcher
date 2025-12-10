import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import type { FileResult } from "@replays/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import React from "react";

import { IconMenu } from "@/components/icon_menu";
import { useReplays } from "@/lib/hooks/use_replays";

import { ReplayFileContainer } from "../replay_file/replay_file.container";
import { FileListMessages as Messages } from "./file_list.messages";

const LOAD_MORE_THRESHOLD = 5;
const REPLAY_FILE_ITEM_SIZE = 90;

// This is the container for all the replays visible, using TanStack Virtual for smooth 60fps scrolling
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

  // Initialize virtualizer with optimal settings for 60fps
  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: React.useCallback(() => REPLAY_FILE_ITEM_SIZE, []),
    overscan: 5, // Render 5 items above/below viewport for smooth scrolling
    initialOffset: initialScrollOffset, // Set initial scroll position
    // Using fixed size, no dynamic measurement needed
  });

  // Track filter values with ref to avoid re-renders
  const lastFilterRef = React.useRef({ folderPath });

  // Reset scroll position when we change folders
  React.useEffect(() => {
    if (folderPath !== lastFilterRef.current.folderPath) {
      currentScrollOffset.current = 0;
      lastFilterRef.current.folderPath = folderPath;
      // Use microtask to avoid flushSync warning during render
      queueMicrotask(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = 0;
        }
      });
    }
  }, [folderPath]);

  // Track scroll offset from the container for persistence
  React.useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      currentScrollOffset.current = scrollElement.scrollTop;
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Save scroll position when component unmounts
  React.useEffect(() => {
    return () => {
      // Convert pixel offset to row index for storage
      const rowIndex = Math.floor(currentScrollOffset.current / REPLAY_FILE_ITEM_SIZE);
      onScrollPositionChange(rowIndex);
    };
  }, [onScrollPositionChange]);

  // Track scroll position and trigger load more when approaching end
  const virtualItems = virtualizer.getVirtualItems();

  React.useEffect(() => {
    const items = virtualizer.getVirtualItems();
    if (items.length > 0) {
      // Check if we need to load more items
      const lastItem = items[items.length - 1];
      const itemsFromEnd = files.length - lastItem.index;

      if (itemsFromEnd <= LOAD_MORE_THRESHOLD) {
        onLoadMore();
      }
    }
  }, [virtualizer, files.length, onLoadMore]);

  return (
    <div
      ref={parentRef}
      style={{
        height: "100%",
        width: "100%",
        overflow: "auto",
        contain: "strict", // CSS containment for better performance
        willChange: "transform", // GPU acceleration hint
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => {
          const file = files[virtualItem.index];
          return (
            <div
              key={String(virtualItem.key)}
              data-index={virtualItem.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ReplayFileContainer
                onOpenMenu={onOpenMenu}
                index={virtualItem.index}
                onSelect={onSelect}
                onClick={onClick}
                onPlay={onPlay}
                selectedFilesSet={selectedFilesSet}
                {...file}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// the container containing FileListResults. figure the rest out yourself
// to simplify the DOM, the submenu for each row is essentially the same until you actually click on it for a given row.
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
    const initialScrollOffset = React.useRef(useReplays.getState().scrollRowItem * REPLAY_FILE_ITEM_SIZE);

    // Callback to save scroll position to store (called on unmount)
    const handleScrollPositionChange = React.useCallback((rowIndex: number) => {
      useReplays.setState({ scrollRowItem: rowIndex });
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
      <div style={{ display: "flex", flexFlow: "column", height: "100%", flex: "1" }}>
        <div
          style={{
            flex: "1",
            overflow: "hidden",
            // Container for the virtualized list - no transform needed here
            // as TanStack Virtual handles its own optimization
          }}
        >
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
        </div>
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
      </div>
    );
  },
);
