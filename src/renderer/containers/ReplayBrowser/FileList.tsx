import React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ReplayFile } from "./ReplayFile";
import { FileResult } from "common/replayBrowser";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import ListItemText from "@material-ui/core/ListItemText";
import { shell } from "electron";
import SearchIcon from "@material-ui/icons/Search";
import FolderIcon from "@material-ui/icons/Folder";
import DeleteIcon from "@material-ui/icons/Delete";
import { withStyles } from "@material-ui/core/styles";
import { useReplays } from "@/store/replays";

const EmptyFolder: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        fontSize: 74,
      }}
    >
      <SearchIcon fontSize="inherit" />
      <Typography variant="h6" style={{ marginTop: 20 }}>
        No SLP files found
      </Typography>
    </div>
  );
};

const StyledListItemIcon = withStyles(() => ({
  root: {
    marginRight: "10px",
  },
}))(ListItemIcon);

const FileListResults: React.FC<{
  onOpenMenu: (index: number, element: HTMLElement) => void;
  onSelect: (index: number) => void;
  files: FileResult[];
}> = ({ files, onSelect, onOpenMenu }) => {
  const Row = React.useCallback(
    (props: { style?: React.CSSProperties; index: number }) => (
      <ReplayFile
        onOpenMenu={onOpenMenu}
        index={props.index}
        style={props.style}
        onSelect={() => onSelect(props.index)}
        {...files[props.index]}
      />
    ),
    [files, onSelect, onOpenMenu]
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          itemCount={files.length}
          itemSize={85}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
};

export const FileList: React.FC<{
  files: FileResult[];
  onSelect: (index: number) => void;
}> = ({ files, onSelect }) => {
  // const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const deleteFile = useReplays((store) => store.deleteFile);
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
      shell.showItemInFolder(files[menuItem.index].fullPath);
    }
    handleClose();
  };

  const handleDelete = () => {
    if (menuItem) {
      deleteFile(files[menuItem.index].fullPath);
    }
    handleClose();
  };

  const handleClose = () => {
    setMenuItem(null);
  };

  return (
    <div
      style={{ display: "flex", flexFlow: "column", height: "100%", flex: "1" }}
    >
      <div style={{ flex: "1", overflow: "hidden" }}>
        {files.length > 0 ? (
          <FileListResults
            onOpenMenu={onOpenMenu}
            onSelect={onSelect}
            files={files}
          />
        ) : (
          <EmptyFolder />
        )}
      </div>
      <Menu
        anchorEl={menuItem ? menuItem.anchorEl : null}
        open={Boolean(menuItem)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleRevealLocation}>
          <StyledListItemIcon>
            <FolderIcon fontSize="small" />
          </StyledListItemIcon>
          <ListItemText primary="Reveal location" />
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <StyledListItemIcon>
            <DeleteIcon fontSize="small" />
          </StyledListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </div>
  );
};
