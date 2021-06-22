import { DiscoveredConsoleInfo } from "@console/types";
import styled from "@emotion/styled";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import CreateIcon from "@material-ui/icons/Create";
import DeleteIcon from "@material-ui/icons/Delete";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import { StoredConnection } from "@settings/types";
import { ConnectionStatus } from "@slippi/slippi-js";
import React from "react";

import { IconMessage } from "@/components/Message";
import { useConsoleDiscoveryStore } from "@/lib/hooks/useConsoleDiscovery";
import { useSettings } from "@/lib/hooks/useSettings";

import { SavedConnectionItem } from "./SavedConnectionItem";

export interface SavedConnectionsListProps {
  availableConsoles: DiscoveredConsoleInfo[];
  onDelete: (conn: StoredConnection) => void;
  onEdit: (conn: StoredConnection) => void;
}

export const SavedConnectionsList: React.FC<SavedConnectionsListProps> = ({ availableConsoles, onEdit, onDelete }) => {
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

  const connectedConsoles = useConsoleDiscoveryStore((store) => store.connectedConsoles);
  const savedConnections = useSettings((store) => store.connections);

  const handleClose = () => {
    setMenuItem(null);
  };

  const handleDelete = () => {
    if (menuItem && menuItem.index >= 0) {
      onDelete(savedConnections[menuItem.index]);
    }
    handleClose();
  };

  const handleEdit = () => {
    if (menuItem && menuItem.index >= 0) {
      onEdit(savedConnections[menuItem.index]);
    }
    handleClose();
  };

  return (
    <Outer>
      {savedConnections.length === 0 ? (
        <IconMessage Icon={HelpOutlineIcon} label="No saved console connections" />
      ) : (
        <div>
          {savedConnections.map((conn, index) => {
            const consoleStatus = connectedConsoles[conn.ipAddress];
            const status = consoleStatus?.status;
            const consoleInfo = availableConsoles.find((item) => item.ip === conn.ipAddress);
            return (
              <SavedConnectionItem
                key={conn.id}
                status={status ?? ConnectionStatus.DISCONNECTED}
                isAvailable={Boolean(consoleInfo)}
                currentFilename={consoleStatus?.filename ?? null}
                nickname={consoleStatus?.nickname ?? consoleInfo?.name}
                connection={conn}
                index={index}
                onOpenMenu={onOpenMenu}
              />
            );
          })}
        </div>
      )}
      <Menu anchorEl={menuItem ? menuItem.anchorEl : null} open={Boolean(menuItem)} onClose={handleClose}>
        <MenuItem onClick={handleEdit}>
          <StyledListItemIcon>
            <CreateIcon fontSize="small" />
          </StyledListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <StyledListItemIcon>
            <DeleteIcon fontSize="small" />
          </StyledListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </Outer>
  );
};

const StyledListItemIcon = styled(ListItemIcon)`
  margin-right: 10px;
`;

const Outer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`;
