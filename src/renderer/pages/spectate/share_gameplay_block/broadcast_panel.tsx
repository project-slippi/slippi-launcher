import { ConnectionStatus } from "@console/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import { formatDuration, intervalToDuration } from "date-fns";
import React from "react";
import TimeAgo from "react-timeago";
// eslint-disable-next-line import/no-unresolved
import { makeIntlFormatter } from "react-timeago/defaultFormatter";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { getLocale } from "@/lib/time";
import type { SupportedLanguage } from "@/services/i18n/util";
import { colors } from "@/styles/colors";

import { BroadcastPanelMessages as Messages } from "./broadcast_panel.messages";
import { StartBroadcastDialog } from "./start_broadcast_dialog";

type BroadcastPanelProps = {
  dolphinStatus: ConnectionStatus;
  slippiServerStatus: ConnectionStatus;
  startTime?: Date;
  endTime?: Date;
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

  const currentLanguage = useAppStore((store) => store.currentLanguage);
  const intlFormatter = React.useMemo(
    () =>
      makeIntlFormatter({
        locale: currentLanguage,
      }),
    [currentLanguage],
  );

  const broadcastDuration =
    startTime && endTime
      ? intervalToDuration({
          start: startTime,
          end: endTime,
        })
      : null;

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
            {Messages.status()}
          </span>
          {isConnected ? Messages.connected() : isDisconnected ? Messages.disconnected() : Messages.connecting()}
        </div>
        <div css={css``}>
          {isDisconnected ? (
            <ConnectButton variant="contained" color="secondary" onClick={() => setModalOpen(true)}>
              {Messages.startBroadcast()}
            </ConnectButton>
          ) : (
            <ConnectButton variant="outlined" color="secondary" onClick={onDisconnect}>
              {Messages.stopBroadcast()}
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
        {isConnected && startTime != null && (
          <div>
            {Messages.broadcastStarted()} <TimeAgo date={startTime} formatter={intlFormatter} />
          </div>
        )}
        {isDisconnected && broadcastDuration && (
          <div>
            {Messages.broadcastEnded(
              formatDuration(broadcastDuration, { locale: getLocale(currentLanguage as SupportedLanguage) }),
            )}
          </div>
        )}
      </div>
      <StartBroadcastDialog open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={onStartBroadcast} />
    </div>
  );
};

const ConnectButton = styled(Button)`
  width: 100%;
`;
