import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import { ConnectionStatus } from "@slippi/slippi-js";
import moment from "moment";
import React from "react";
import TimeAgo from "react-timeago";

import { StartBroadcastDialog } from "./StartBroadcastDialog";

export interface BroadcastPanelProps {
  dolphinStatus: ConnectionStatus;
  slippiServerStatus: ConnectionStatus;
  startTime: Date | null;
  endTime: Date | null;
  onStartBroadcast: (viewerId: string) => void;
  onDisconnect: () => void;
}

export const BroadcastPanel: React.FC<BroadcastPanelProps> = ({
  slippiServerStatus,
  dolphinStatus,
  startTime,
  endTime,
  onStartBroadcast,
  onDisconnect,
}) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const isDisconnected =
    slippiServerStatus === ConnectionStatus.DISCONNECTED && dolphinStatus === ConnectionStatus.DISCONNECTED;
  const isConnected = slippiServerStatus === ConnectionStatus.CONNECTED && dolphinStatus === ConnectionStatus.CONNECTED;

  const broadcastDuration = startTime && endTime ? moment.duration(moment(endTime).diff(moment(startTime))) : null;

  return (
    <div>
      <div
        css={css`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          grid-gap: 15px;
        `}
      >
        <div
          css={css`
            background-color: rgba(0, 0, 0, 0.4);
            padding: 5px 10px;
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
          `}
        >
          <span
            css={css`
              text-transform: uppercase;
              font-weight: bold;
              color: ${colors.purpleLight};
              margin-right: 10px;
            `}
          >
            Status
          </span>
          {isConnected ? "Connected" : isDisconnected ? "Disconnected" : "Connecting"}
        </div>
        <div css={css``}>
          {isDisconnected ? (
            <ConnectButton variant="contained" color="primary" onClick={() => setModalOpen(true)}>
              Start Broadcast
            </ConnectButton>
          ) : (
            <ConnectButton variant="outlined" color="secondary" onClick={onDisconnect}>
              Stop Broadcast
            </ConnectButton>
          )}
        </div>
      </div>
      <div
        css={css`
          font-size: 13px;
          opacity: 0.8;
          margin-top: 10px;
        `}
      >
        {isConnected && startTime !== null && (
          <div>
            Broadcast started <TimeAgo date={startTime} />
          </div>
        )}
        {isDisconnected && broadcastDuration && <div>Broadcast ended after {broadcastDuration.humanize()}</div>}
      </div>
      <StartBroadcastDialog open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={onStartBroadcast} />
    </div>
  );
};

const ConnectButton = styled(Button)`
  width: 100%;
`;
