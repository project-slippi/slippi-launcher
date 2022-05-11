import type { DiscoveredConsoleInfo } from "@console/types";
import styled from "@emotion/styled";
import CreateIcon from "@mui/icons-material/Create";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import type { StoredConnection } from "@settings/types";
import { ConnectionStatus } from "@slippi/slippi-js";
import React from "react";

import { IconMenu } from "@/components/IconMenu";
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
  const [nintendontVersion, setNintendontVersion] = React.useState("1.8.0");
  const [menuItem, setMenuItem] = React.useState<null | {
    index: number;
    anchorEl: HTMLElement;
    ipAddress: string;
  }>(null);

  const onOpenMenu = React.useCallback((index: number, target: any, ipAddress: string) => {
    setMenuItem({
      index,
      anchorEl: target,
      ipAddress,
    });
  }, []);

  const connectedConsoles = useConsoleDiscoveryStore((store) => store.connectedConsoles);
  const savedConnections = useSettings((store) => store.connections);

  const consoleIsConnected = React.useCallback(
    (ipAddress?: string): boolean => {
      if (!ipAddress) {
        return false;
      }
      const status = connectedConsoles[ipAddress]?.status ?? null;
      return status !== null && status !== ConnectionStatus.DISCONNECTED;
    },
    [connectedConsoles],
  );

  const handleClose = () => {
    setMenuItem(null);
  };

  const handleDelete = () => {
    if (menuItem && menuItem.index >= 0 && !consoleIsConnected(menuItem.ipAddress)) {
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

  React.useEffect(() => {
    window.electron.common
      .getLatestGithubReleaseVersion("project-slippi", "Nintendont")
      .then((version) => {
        setNintendontVersion(version);
      })
      .catch(console.error);
  }, []);

  return (
    <Outer>
      {savedConnections.length === 0 ? (
        <IconMessage Icon={HelpOutlineIcon} label="No saved console connections" />
      ) : (
        <div>
          {savedConnections.map((conn, index) => {
            const consoleStatus = connectedConsoles[conn.ipAddress];
            const status = consoleStatus?.status;
            const isMirroring = consoleStatus?.isMirroring;
            const consoleInfo = availableConsoles.find((item) => item.ip === conn.ipAddress);
            return (
              <SavedConnectionItem
                key={conn.id}
                status={status ?? ConnectionStatus.DISCONNECTED}
                isMirroring={isMirroring ?? false}
                isAvailable={Boolean(consoleInfo)}
                currentFilename={consoleStatus?.filename ?? null}
                nintendontVersion={consoleStatus?.nintendontVersion ?? null}
                latestVersion={nintendontVersion}
                nickname={consoleStatus?.nickname ?? consoleInfo?.name}
                connection={conn}
                index={index}
                onOpenMenu={onOpenMenu}
              />
            );
          })}
        </div>
      )}
      <IconMenu
        anchorEl={menuItem ? menuItem.anchorEl : null}
        open={Boolean(menuItem)}
        onClose={handleClose}
        items={[
          {
            onClick: handleEdit,
            icon: <CreateIcon fontSize="small" />,
            label: "Edit",
          },
          {
            onClick: handleDelete,
            icon: <DeleteIcon fontSize="small" />,
            label: "Delete",
            disabled: consoleIsConnected(menuItem?.ipAddress),
          },
        ]}
      />
    </Outer>
  );
};

const Outer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 0;
`;
