/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import SyncIcon from "@material-ui/icons/Sync";
import React from "react";

import { DualPane } from "@/components/DualPane";
import { Button } from "@/components/FormInputs";
import { IconMessage } from "@/components/Message";
import { useAccount } from "@/lib/hooks/useAccount";
import { useBroadcastList } from "@/lib/hooks/useBroadcastList";

import { Footer } from "./Footer";
import { ShareGameplayBlock } from "./ShareGameplayBlock";
import { SpectateItem } from "./SpectateItem";
import { SpectatorIdBlock } from "./SpectatorIdBlock";

export const SpectatePage: React.FC = () => {
  const user = useAccount((store) => store.user);
  const [currentBroadcasts, refreshBroadcasts] = useBroadcastList();

  const startWatching = async (id: string) => {
    await window.electron.broadcast.watchBroadcast(id);
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
                <Button startIcon={<SyncIcon />} onClick={refreshBroadcasts}>
                  Refresh
                </Button>
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

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;
