import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import type { FileResult } from "@replays/types";
import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { ErrorBoundary } from "@/components/error_boundary";
import { IconMenu } from "@/components/icon_menu";
import { useReplays } from "@/lib/hooks/use_replays";

import { ReplayFileContainer } from "../replay_file/replay_file.container";
import { FileListMessages as Messages } from "./file_list.messages";

const LOAD_MORE_THRESHOLD = 5;
const REPLAY_FILE_ITEM_SIZE = 90;

// This is the container for all the replays visible, the autosizer will handle the virtualization portion
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
  // Keep a reference to the list so we can control the scroll position
  const listRef = React.useRef<List>(null);
  // Track current scroll row for saving on unmount
  const currentScrollRow = React.useRef(initialScrollOffset / REPLAY_FILE_ITEM_SIZE);

  // Use itemData to pass dependencies to Row without recreating the Row component
  const itemData = React.useMemo(
    () => ({
      files,
      onOpenMenu,
      onSelect,
      onClick,
      onPlay,
      selectedFilesSet,
    }),
    [files, onSelect, onPlay, onOpenMenu, onClick, selectedFilesSet],
  );

  const Row = React.useCallback(
    (props: { style?: React.CSSProperties; index: number; data: typeof itemData }) => {
      const { files, onOpenMenu, onSelect, onClick, onPlay, selectedFilesSet } = props.data;
      const file = files[props.index];
      return (
        <ErrorBoundary>
          <ReplayFileContainer
            onOpenMenu={onOpenMenu}
            index={props.index}
            style={props.style}
            onSelect={onSelect}
            onClick={onClick}
            onPlay={onPlay}
            selectedFilesSet={selectedFilesSet}
            {...file}
          />
        </ErrorBoundary>
      );
    },
    [], // Row itself never changes
  );

  // Track filter values with ref to avoid re-renders
  const lastFilterRef = React.useRef({ folderPath });

  // Reset scroll position when we change folders or filters
  React.useEffect(() => {
    if (listRef.current && folderPath !== lastFilterRef.current.folderPath) {
      listRef.current.scrollToItem(0);
      currentScrollRow.current = 0;
      lastFilterRef.current.folderPath = folderPath;
    }
  }, [folderPath]);

  // Save scroll position when component unmounts
  React.useEffect(() => {
    return () => {
      onScrollPositionChange(Math.floor(currentScrollRow.current));
    };
  }, [onScrollPositionChange]);

  // Memoize onItemsRendered to prevent recreating on every render
  const handleItemsRendered = React.useCallback(
    ({ visibleStartIndex, visibleStopIndex }: { visibleStartIndex: number; visibleStopIndex: number }) => {
      // Update current scroll position (stored locally, not in store)
      currentScrollRow.current = visibleStartIndex;

      // Trigger load more when user scrolls near the end
      const itemsFromEnd = files.length - visibleStopIndex;
      if (itemsFromEnd <= LOAD_MORE_THRESHOLD) {
        onLoadMore();
      }
    },
    [files.length, onLoadMore],
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          ref={listRef}
          height={height}
          width={width}
          initialScrollOffset={initialScrollOffset}
          itemCount={files.length}
          itemSize={REPLAY_FILE_ITEM_SIZE}
          itemData={itemData}
          onItemsRendered={handleItemsRendered}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
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
            willChange: "transform",
            // Enable GPU acceleration for smooth scrolling
            transform: "translateZ(0)",
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
