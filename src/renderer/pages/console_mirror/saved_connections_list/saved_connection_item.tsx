import { ConnectionStatus, Ports } from "@console/types";
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
import React from "react";
import { lt } from "semver";

import { ExternalLink as A } from "@/components/external_link";
import { LabelledText } from "@/components/labelled_text";
import { buildMirrorConfig } from "@/lib/console_connection";
import { useConsoleDiscoveryStore } from "@/lib/hooks/use_console_discovery";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";
import { ReactComponent as WiiIcon } from "@/styles/images/wii_icon.svg";

import { SavedConnectionItemMessages as Messages } from "./saved_connection_item.messages";

const path = window.electron.path;

type SavedConnectionItemProps = {
  index: number;
  isAvailable?: boolean;
  status: number;
  isMirroring: boolean;
  nickname?: string;
  currentFilename?: string;
  nintendontVersion?: string;
  latestVersion: string;
  connection: StoredConnection;
  onOpenMenu: (index: number, element: HTMLElement, ipAddress: string) => void;
};

export const SavedConnectionItem = ({
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
}: SavedConnectionItemProps) => {
  const { showError } = useToasts();
  const { consoleService } = useServices();
  const optOutOfAutoConnect = useConsoleDiscoveryStore((store) => store.optOutOfAutoConnect);
  const allowAutoConnect = useConsoleDiscoveryStore((store) => store.allowAutoConnect);
  const onConnect = React.useCallback(async () => {
    // Manually connecting re-opts the console into auto-connect.
    allowAutoConnect(connection.ipAddress);
    await consoleService.connectToConsoleMirror(buildMirrorConfig(connection, nickname));
  }, [consoleService, connection, nickname, allowAutoConnect]);
  const onMirror = React.useCallback(() => {
    consoleService.startMirroring(connection.ipAddress).catch(showError);
  }, [consoleService, connection, showError]);
  const onDisconnect = () => {
    // Manually disconnecting opts the console out of auto-connect for this session.
    optOutOfAutoConnect(connection.ipAddress);
    void consoleService.disconnectFromConsole(connection.ipAddress);
  };
  const statusName =
    status === ConnectionStatus.DISCONNECTED && isAvailable ? Messages.available() : renderStatusName(status);
  const isConnected = status !== ConnectionStatus.DISCONNECTED;
  const title = nickname ? `${connection.ipAddress} (${nickname})` : connection.ipAddress;
  const nintendontIsOutdated = nintendontVersion != null && lt(nintendontVersion, latestVersion);
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
          <LabelledText label={Messages.targetFolder()}>
            <span
              css={css`
                font-size: 14px;
              `}
            >
              {connection.useNicknameFolders
                ? path.join(connection.folderPath, nickname?.trim() ?? "")
                : connection.folderPath}
            </span>
          </LabelledText>
          {connection.enableRelay && (
            <LabelledText
              label={Messages.relayPort()}
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
          <LabelledText label={Messages.currentFile()}>
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
          {isConnected ? Messages.disconnect() : Messages.connect()}
        </Button>
        <Button size="small" onClick={onMirror} color="primary" disabled={!isConnected || isMirroring}>
          {Messages.mirror()}
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
      return Messages.connected();
    case ConnectionStatus.CONNECTING:
      return Messages.connecting();
    case ConnectionStatus.RECONNECT_WAIT:
      return Messages.reconnecting();
    case ConnectionStatus.DISCONNECTED:
      return Messages.disconnected();
    default:
      return Messages.unknownStatus(status);
  }
};

const OutdatedNintendontWarning = () => {
  return (
    <A
      href="https://slippi.gg/downloads"
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
      `}
    >
      <WarningIcon />
      <span>{Messages.yourNintendontIsOutOfDate()}</span>
    </A>
  );
};
