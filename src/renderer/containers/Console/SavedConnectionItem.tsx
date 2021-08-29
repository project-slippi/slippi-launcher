/** @jsx jsx */

import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { StoredConnection } from "@settings/types";
import { ConnectionStatus, Ports } from "@slippi/slippi-js";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { LabelledText } from "@/components/LabelledText";
import { connectToConsole, disconnectFromConsole, startConsoleMirror } from "@/lib/consoleConnection";
import { ReactComponent as WiiIcon } from "@/styles/images/wii-icon.svg";

export interface SavedConnectionItemProps {
  index: number;
  isAvailable?: boolean;
  status: number;
  isMirroring: boolean;
  nickname?: string;
  currentFilename: string | null;
  connection: StoredConnection;
  onOpenMenu: (index: number, element: HTMLElement) => void;
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
}) => {
  const { addToast } = useToasts();
  const onConnect = () => connectToConsole(connection);
  const onMirror = () => {
    startConsoleMirror(connection.ipAddress).catch((err) => {
      addToast(err.message ?? JSON.stringify(err), {
        appearance: "error",
      });
    });
  };
  const onDisconnect = () => disconnectFromConsole(connection.ipAddress);
  const statusName = status === ConnectionStatus.DISCONNECTED && isAvailable ? "Available" : renderStatusName(status);
  const isConnected = status !== ConnectionStatus.DISCONNECTED;
  const title = nickname ? `${connection.ipAddress} (${nickname})` : connection.ipAddress;
  return (
    <Outer>
      <CardHeader
        avatar={<WiiIcon fill="#ffffff" width="40px" />}
        action={
          <Tooltip disableHoverListener={!isConnected} title="Options disabled while connected">
            <div>
              <IconButton disabled={isConnected} onClick={(e) => onOpenMenu(index, e.currentTarget as HTMLElement)}>
                <MoreVertIcon />
              </IconButton>
            </div>
          </Tooltip>
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
              {connection.folderPath}
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
