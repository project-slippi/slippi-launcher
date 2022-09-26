import type { MirrorConfig } from "@console/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import IconButton from "@mui/material/IconButton";
import type { StoredConnection } from "@settings/types";
import { ConnectionStatus, Ports } from "@slippi/slippi-js";
import React from "react";
import { lt } from "semver";

import { ExternalLink as A } from "@/components/ExternalLink";
import { LabelledText } from "@/components/LabelledText";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";
import { ReactComponent as WiiIcon } from "@/styles/images/wii-icon.svg";

const path = window.electron.path;

export interface SavedConnectionItemProps {
  index: number;
  isAvailable?: boolean;
  status: number;
  isMirroring: boolean;
  nickname?: string;
  currentFilename: string | null;
  nintendontVersion: string | null;
  latestVersion: string;
  connection: StoredConnection;
  onOpenMenu: (index: number, element: HTMLElement, ipAddress: string) => void;
}

export const SavedConnectionItem: React.FC<SavedConnectionItemProps> = ({
  index,
  connection,
  onOpenMenu,
  status,
  isMirroring,
  nickname,
  isAvailable,
  currentFilename,
  nintendontVersion,
  latestVersion,
}) => {
  const { showError } = useToasts();
  const { consoleService } = useServices();
  const onConnect = React.useCallback(async () => {
    const conn = connection;
    const config: MirrorConfig = {
      id: conn.id,
      ipAddress: conn.ipAddress,
      port: conn.port ?? Ports.DEFAULT,
      folderPath: conn.folderPath,
      isRealtime: conn.isRealtime,
      enableRelay: conn.enableRelay,
      useNicknameFolders: conn.useNicknameFolders,
      nickname,
    };

    // Add OBS config if necessary
    if (conn.enableAutoSwitcher && conn.obsIP && conn.obsPort && conn.obsSourceName) {
      config.autoSwitcherSettings = {
        ip: conn.obsIP,
        port: conn.obsPort,
        password: conn.obsPassword,
        sourceName: conn.obsSourceName,
      };
    }

    await consoleService.connectToConsoleMirror(config);
  }, [consoleService, connection, nickname]);
  const onMirror = React.useCallback(() => {
    consoleService.startMirroring(connection.ipAddress).catch(showError);
  }, [consoleService, connection, showError]);
  const onDisconnect = () => consoleService.disconnectFromConsole(connection.ipAddress);
  const statusName = status === ConnectionStatus.DISCONNECTED && isAvailable ? "Available" : renderStatusName(status);
  const isConnected = status !== ConnectionStatus.DISCONNECTED;
  const title = nickname ? `${connection.ipAddress} (${nickname})` : connection.ipAddress;
  const nintendontIsOutdated = nintendontVersion !== null && lt(nintendontVersion, latestVersion);
  return (
    <Outer>
      <CardHeader
        avatar={<WiiIcon fill="#ffffff" width="40px" />}
        action={
          <IconButton
            onClick={(e) => onOpenMenu(index, e.currentTarget as HTMLElement, connection.ipAddress)}
            size="large"
          >
            <MoreVertIcon />
          </IconButton>
        }
        title={title}
        subheader={statusName}
      />
      <CardContent
        css={css`
          &&& {
            padding-top: 0;
            padding-bottom: 0;
          }
        `}
      >
        {nintendontIsOutdated && <OutdatedNintendontWarning />}
        <div
          css={css`
            display: flex;
            align-items: center;
            flex: 1;
            margin-bottom: 10px;
          `}
        >
          <LabelledText label="Target folder">
            <span
              css={css`
                font-size: 14px;
              `}
            >
              {connection.useNicknameFolders ? path.join(connection.folderPath, nickname ?? "") : connection.folderPath}
            </span>
          </LabelledText>
          {connection.enableRelay && (
            <LabelledText
              label="Relay Port"
              css={css`
                margin-left: 20px;
              `}
            >
              <span
                css={css`
                  font-size: 14px;
                `}
              >
                {Ports.RELAY_START + connection.id}
              </span>
            </LabelledText>
          )}
        </div>
        {currentFilename && (
          <LabelledText label="Current file" css={css``}>
            <span
              css={css`
                font-size: 14px;
              `}
            >
              {currentFilename}
            </span>
          </LabelledText>
        )}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color={isConnected ? "secondary" : "primary"}
          onClick={isConnected ? onDisconnect : onConnect}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
        <Button size="small" onClick={onMirror} color="primary" disabled={!isConnected || isMirroring}>
          Mirror
        </Button>
      </CardActions>
    </Outer>
  );
};

const Outer = styled(Card)`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const renderStatusName = (status: number) => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return "Connected";
    case ConnectionStatus.CONNECTING:
      return "Connecting";
    case ConnectionStatus.RECONNECT_WAIT:
      return "Reconnecting";
    case ConnectionStatus.DISCONNECTED:
      return "Disconnected";
    default:
      return `Unknown status: ${status}`;
  }
};

const OutdatedNintendontWarning: React.FC = () => {
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        padding: 5px 10px;
        background-color: #f2d994;
        color: #8d571a;
        border: solid 2px #8d571a;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        svg {
          padding: 5px;
          margin-right: 5px;
        }
        margin-bottom: 20px;
        a {
          text-decoration: underline;
        }
      `}
    >
      <WarningIcon />
      <span>
        Your Nintendont is out of date and no longer supported. Download the latest version from{" "}
        <A href="https://slippi.gg/downloads">the Slippi website</A>.
      </span>
    </div>
  );
};
