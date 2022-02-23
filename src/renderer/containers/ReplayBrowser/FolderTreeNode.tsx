import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FolderIcon from "@material-ui/icons/Folder";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import { FolderResult } from "@replays/types";
import { colors } from "common/colors";
import React from "react";

import { useReplays } from "@/lib/hooks/useReplays";

export interface FolderTreeNodeProps {
  nestLevel?: number;
  folder: FolderResult;
  collapsedFolders: readonly string[];
  onClick: (fullPath: string) => void;
  onToggle: (fullPath: string) => void;
}

export const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  nestLevel = 0,
  folder,
  collapsedFolders,
  onClick,
  onToggle,
}) => {
  const currentFolder = useReplays((store) => store.currentFolder);
  const hasChildren = folder.subdirectories.length > 0;
  const isCollapsed = collapsedFolders.includes(folder.fullPath);
  const isSelected = currentFolder === folder.fullPath;
  const labelColor = isSelected ? colors.grayDark : "rgba(255, 255, 255, 0.5)";
  return (
    <div>
      <ListItem
        onClick={() => onClick(folder.fullPath)}
        button={true}
        style={{
          backgroundColor: isSelected ? colors.greenPrimary : undefined,
          color: labelColor,
          padding: 0,
          paddingLeft: nestLevel * 15,
        }}
      >
        <ListItemIcon>
          <IconButton
            size="small"
            style={{ color: labelColor }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!hasChildren) {
                onClick(folder.fullPath);
              } else {
                onToggle(folder.fullPath);
              }
            }}
          >
            {!hasChildren ? (
              <FolderIcon fontSize="small" />
            ) : isCollapsed ? (
              <KeyboardArrowDownIcon fontSize="small" />
            ) : (
              <KeyboardArrowUpIcon fontSize="small" />
            )}
          </IconButton>
        </ListItemIcon>
        <ListItemText
          primaryTypographyProps={{
            style: {
              whiteSpace: "nowrap",
              cursor: "pointer",
              marginLeft: 10,
              fontWeight: isSelected ? "bold" : "normal",
            },
          }}
          primary={folder.name}
        />
      </ListItem>
      {folder.subdirectories.length === 0 || isCollapsed ? null : (
        <List dense={true} style={{ padding: 0 }}>
          {folder.subdirectories.map((f) => (
            <FolderTreeNode
              nestLevel={nestLevel + 1}
              key={f.fullPath}
              folder={f}
              collapsedFolders={collapsedFolders}
              onClick={onClick}
              onToggle={onToggle}
            />
          ))}
        </List>
      )}
    </div>
  );
};
