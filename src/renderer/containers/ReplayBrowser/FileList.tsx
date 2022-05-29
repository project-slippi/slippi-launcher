import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import type { FileResult } from "@replays/types";
import { debounce } from "lodash";
import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { IconMenu } from "@/components/IconMenu";

import { ReplayFile } from "./ReplayFile";

const REPLAY_FILE_ITEM_SIZE = 90;

// This is the container for all the replays visible, the autosizer will handle the virtualization portion
const FileListResults: React.FC<{
  folderPath: string;
  files: FileResult[];
  scrollRowItem: number;
  selectedFiles: Array<string>;
  onClick: (index: number, isShiftHeld: boolean) => void;
  onOpenMenu: (index: number, element: HTMLElement) => void;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  setScrollRowItem: (row: number) => void;
}> = ({ folderPath, scrollRowItem, files, onSelect, onPlay, onOpenMenu, setScrollRowItem, onClick, selectedFiles }) => {
  // Keep a reference to the list so we can control the scroll position
  const listRef = React.createRef<List>();
  // Keep track of the latest scroll position
  const scrollRowRef = React.useRef(0);
  const setScrollRowRef = debounce((row: number) => {
    scrollRowRef.current = row;
  }, 100);

  const Row = React.useCallback(
    (props: { style?: React.CSSProperties; index: number }) => {
      const file = files[props.index];
      const selectedIndex = selectedFiles.indexOf(file.fullPath);
      return (
        <ErrorBoundary>
          <ReplayFile
            onOpenMenu={onOpenMenu}
            index={props.index}
            style={props.style}
            onSelect={() => onSelect(props.index)}
            onClick={(e) => onClick(props.index, e.shiftKey)}
            selectedFiles={selectedFiles}
            selectedIndex={selectedIndex}
            onPlay={() => onPlay(props.index)}
            {...file}
          />
        </ErrorBoundary>
      );
    },
    [files, onSelect, onPlay, onOpenMenu, selectedFiles],
  );

  // Store the latest scroll row item on unmount
  React.useEffect(() => {
    return () => {
      setScrollRowItem(scrollRowRef.current);
    };
  }, []);

  // Reset scroll position when we change folders
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [folderPath]);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          ref={listRef}
          height={height}
          width={width}
          initialScrollOffset={scrollRowItem * REPLAY_FILE_ITEM_SIZE}
          itemCount={files.length}
          itemSize={REPLAY_FILE_ITEM_SIZE}
          onItemsRendered={({ visibleStartIndex }) => {
            setScrollRowRef(visibleStartIndex);
          }}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};

// the container containing FileListResults. figure the rest out yourself
// to simplify the DOM, the submenu for each row is essentially the same until you actually click on it for a given row.
export const FileList: React.FC<{
  folderPath: string;
  files: FileResult[];
  scrollRowItem?: number;
  setScrollRowItem: (row: number) => void;
  onDelete: (filepath: string) => void;
  onSelect: (index: number) => void;
  onFileClick: (index: number, isShiftHeld: boolean) => void;
  selectedFiles: Array<string>;
  onPlay: (index: number) => void;
}> = ({
  scrollRowItem = 0,
  files,
  onSelect,
  onPlay,
  onDelete,
  setScrollRowItem,
  onFileClick,
  folderPath,
  selectedFiles,
}) => {
  const [menuItem, setMenuItem] = React.useState<null | {
    index: number;
    anchorEl: HTMLElement;
  }>(null);

  const onOpenMenu = React.useCallback((index: number, target: any) => {
    setMenuItem({
      index,
      anchorEl: target,
    });
  }, []);

  const handleRevealLocation = () => {
    if (menuItem) {
      window.electron.shell.showItemInFolder(files[menuItem.index].fullPath);
    }
    handleClose();
  };

  const handleDelete = () => {
    if (menuItem) {
      onDelete(files[menuItem.index].fullPath);
    }
    handleClose();
  };

  const handleClose = () => {
    setMenuItem(null);
  };

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
          scrollRowItem={scrollRowItem}
          setScrollRowItem={setScrollRowItem}
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
            label: "Reveal location",
          },
          {
            onClick: handleDelete,
            icon: <DeleteIcon fontSize="small" />,
            label: "Delete",
          },
        ]}
      />
    </div>
  );
};
