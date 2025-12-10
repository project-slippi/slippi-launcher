import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import type { FileResult } from "@replays/types";
import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { ErrorBoundary } from "@/components/error_boundary";
import { IconMenu } from "@/components/icon_menu";

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
  selectedFiles,
  onLoadMore,
}: {
  folderPath: string;
  files: FileResult[];
  initialScrollOffset: number;
  selectedFiles: Array<string>;
  onClick: (index: number, isShiftHeld: boolean) => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  onLoadMore: () => void;
}) => {
  // Keep a reference to the list so we can control the scroll position
  const listRef = React.useRef<List>(null);

  // Convert selectedFiles array to Set for O(1) lookups
  const selectedFilesSet = React.useMemo(() => new Set(selectedFiles), [selectedFiles]);

  const Row = React.useCallback(
    (props: { style?: React.CSSProperties; index: number }) => {
      const file = files[props.index];
      const isSelected = selectedFilesSet.has(file.fullPath);
      const selectedIndex = isSelected ? selectedFiles.indexOf(file.fullPath) : -1;
      return (
        <ErrorBoundary>
          <ReplayFileContainer
            onOpenMenu={onOpenMenu}
            index={props.index}
            style={props.style}
            onSelect={onSelect}
            onClick={onClick}
            isSelected={isSelected}
            selectedIndex={selectedIndex}
            onPlay={onPlay}
            {...file}
          />
        </ErrorBoundary>
      );
    },
    [files, onSelect, onPlay, onOpenMenu, onClick, selectedFiles, selectedFilesSet],
  );

  // Track filter values with ref to avoid re-renders
  const lastFilterRef = React.useRef({ folderPath });

  // Reset scroll position when we change folders or filters
  React.useEffect(() => {
    if (listRef.current && folderPath !== lastFilterRef.current.folderPath) {
      listRef.current.scrollToItem(0);
      lastFilterRef.current.folderPath = folderPath;
    }
  }, [folderPath]);

  // Memoize onItemsRendered to prevent recreating on every render
  const handleItemsRendered = React.useCallback(
    ({ visibleStopIndex }: { visibleStartIndex: number; visibleStopIndex: number }) => {
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
    selectedFiles,
    onLoadMore,
  }: {
    folderPath: string;
    files: FileResult[];
    onDelete: (filepath: string) => void;
    onSelect: (index: number) => void;
    onFileClick: (index: number, isShiftHeld: boolean) => void;
    selectedFiles: Array<string>;
    onPlay: (index: number) => void;
    onLoadMore: () => void;
    loadingMore: boolean;
  }) => {
    const [menuItem, setMenuItem] = React.useState<null | {
      index: number;
      anchorEl: HTMLElement;
    }>(null);

    // Store initial scroll offset locally instead of in global store
    const initialScrollOffset = React.useRef(0);

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
        <div style={{ flex: "1", overflow: "hidden" }}>
          <FileListResults
            folderPath={folderPath}
            onOpenMenu={onOpenMenu}
            onSelect={onSelect}
            onPlay={onPlay}
            onClick={onFileClick}
            selectedFiles={selectedFiles}
            files={files}
            initialScrollOffset={initialScrollOffset.current}
            onLoadMore={onLoadMore}
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
