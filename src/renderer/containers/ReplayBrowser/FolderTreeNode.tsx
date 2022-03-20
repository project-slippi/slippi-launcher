import { colors } from "@common/colors";
import FolderIcon from "@mui/icons-material/Folder";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import type { FolderResult } from "@replays/types";
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
