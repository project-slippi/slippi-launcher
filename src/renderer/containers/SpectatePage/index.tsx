/** @jsx jsx */
import { watchBroadcast } from "@broadcast/ipc";
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import SyncIcon from "@material-ui/icons/Sync";
import React from "react";

import { IconMessage } from "@/components/Message";
import { useAccount } from "@/lib/hooks/useAccount";
import { useBroadcastList } from "@/lib/hooks/useBroadcastList";

import { ShareGameplayBlock } from "../Broadcast/ShareGameplayBlock";
import { SpectateItem } from "../Broadcast/SpectateItem";
import { SpectatorIdBlock } from "../Broadcast/SpectatorIdBlock";

const SECOND = 1000;
const AUTO_REFRESH_INTERVAL = 30 * SECOND;

export const SpectatePage: React.FC = () => {
  const user = useAccount((store) => store.user);
  const [currentBroadcasts, refreshBroadcasts] = useBroadcastList();

  React.useEffect(() => {
    // Refresh once on component mount
    refreshBroadcasts();

    // Start automatic refreshing of the broadcast list
    const interval = setInterval(refreshBroadcasts, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const startWatching = async (id: string) => {
    await watchBroadcast.renderer!.trigger({ broadcasterId: id });
  };

  if (!user) {
    return <IconMessage Icon={AccountCircleIcon} label="You must be logged in to use this feature" />;
  }

  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: 60% 40%;
        height: 100%;
        width: 100%;
      `}
    >
      <div
        css={css`
          padding-left: 20px;
        `}
      >
        <h1>Spectate</h1>
        <div>
          <RefreshButton
            variant="contained"
            onClick={refreshBroadcasts}
            color="inherit"
            startIcon={
              <div
                css={css`
                  display: flex;
                  color: #9f74c0;
                `}
              >
                <SyncIcon fontSize="small" />
              </div>
            }
          >
            Refresh
          </RefreshButton>
          <div
            css={css`
              margin-top: 20px;
            `}
          >
            {currentBroadcasts.length === 0 ? (
              <IconMessage Icon={HelpOutlineIcon} label="No users are broadcasting to you" />
            ) : (
              currentBroadcasts.map(({ id, broadcaster, name }) => {
                return (
                  <div key={id}>
                    <SpectateItem
                      broadcasterId={broadcaster.uid}
                      broadcasterName={broadcaster.name}
                      name={name}
                      onWatch={() => startWatching(id)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <div
        css={css`
          padding: 0 20px;
          & > * {
            margin-top: 20px;
          }
        `}
      >
        <SpectatorIdBlock userId={user.uid} />
        <ShareGameplayBlock />
      </div>
    </div>
  );
};

const RefreshButton = styled(Button)`
  .MuiButton-label {
    color: #1b0b28;
    font-weight: 500;
    font-size: 12px;
  }
`;
