import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { ConnectionStatus } from "@slippi/slippi-js";
import * as stylex from "@stylexjs/stylex";
import moment from "moment";
import React from "react";
import TimeAgo from "react-timeago";

import { colors } from "@/styles/tokens.stylex";

import { StartBroadcastDialog } from "./start_broadcast_dialog";

const styles = stylex.create({
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gridGap: 15,
  },
  statusContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: "5px 10px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    textTransform: "uppercase",
    fontWeight: "bold",
    color: colors.purpleLight,
    marginRight: 10,
  },
  broadcastTimeContainer: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 10,
  },
});

type BroadcastPanelProps = {
  dolphinStatus: ConnectionStatus;
  slippiServerStatus: ConnectionStatus;
  startTime: Date | null;
  endTime: Date | null;
  onStartBroadcast: (viewerId: string) => void;
  onDisconnect: () => void;
};

export const BroadcastPanel = ({
  slippiServerStatus,
  dolphinStatus,
  startTime,
  endTime,
  onStartBroadcast,
  onDisconnect,
}: BroadcastPanelProps) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const isDisconnected =
    slippiServerStatus === ConnectionStatus.DISCONNECTED && dolphinStatus === ConnectionStatus.DISCONNECTED;
  const isConnected = slippiServerStatus === ConnectionStatus.CONNECTED && dolphinStatus === ConnectionStatus.CONNECTED;

  const broadcastDuration = startTime && endTime ? moment.duration(moment(endTime).diff(moment(startTime))) : null;

  return (
    <div>
      <div {...stylex.props(styles.gridContainer)}>
        <div {...stylex.props(styles.statusContainer)}>
          <span {...stylex.props(styles.statusText)}>Status</span>
          {isConnected ? "Connected" : isDisconnected ? "Disconnected" : "Connecting"}
        </div>
        <div>
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
      <div {...stylex.props(styles.broadcastTimeContainer)}>
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

const ConnectButton = styled(Button)(() => ({
  width: "100%",
}));
