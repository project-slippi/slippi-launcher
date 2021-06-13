/** @jsx jsx */
import { watchBroadcast } from "@broadcast/ipc";
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import SyncIcon from "@material-ui/icons/Sync";
import React from "react";

import { DualPane } from "@/components/DualPane";
import { IconMessage } from "@/components/Message";
import { useAccount } from "@/lib/hooks/useAccount";
import { useBroadcastList } from "@/lib/hooks/useBroadcastList";

import { Footer } from "./Footer";
import { ShareGameplayBlock } from "./ShareGameplayBlock";
import { SpectateItem } from "./SpectateItem";
import { SpectatorIdBlock } from "./SpectatorIdBlock";

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
    <Outer>
      <div
        css={css`
          display: flex;
          flex: 1;
          position: relative;
          overflow: hidden;
        `}
      >
        <DualPane
          id="spectate-page"
          leftSide={
            <div
              css={css`
                padding-left: 20px;
                padding-right: 10px;
                width: 100%;
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
                    padding-top: 20px;
                    padding-bottom: 20px;
                  `}
                >
                  {currentBroadcasts.length === 0 ? (
                    <IconMessage Icon={HelpOutlineIcon} label="No users are broadcasting to you" />
                  ) : (
                    currentBroadcasts.map(({ id, broadcaster, name }) => {
                      return (
                        <SpectateItem
                          key={id}
                          broadcasterId={broadcaster.uid}
                          broadcasterName={broadcaster.name}
                          name={name}
                          onWatch={() => startWatching(id)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          }
          rightSide={
            <div
              css={css`
                padding-left: 10px;
                padding-right: 20px;
                & > * {
                  margin-top: 20px;
                }
              `}
            >
              <SpectatorIdBlock userId={user.uid} />
              <ShareGameplayBlock />
            </div>
          }
          style={{ gridTemplateColumns: "auto 400px" }}
        />
      </div>
      <Footer />
    </Outer>
  );
};

const RefreshButton = styled(Button)`
  .MuiButton-label {
    color: #1b0b28;
    font-weight: 500;
    font-size: 12px;
  }
`;

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;
