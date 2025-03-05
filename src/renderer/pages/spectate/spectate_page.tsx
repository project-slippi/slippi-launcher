import type { BroadcasterItem } from "@broadcast/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SyncIcon from "@mui/icons-material/Sync";
import React from "react";

import { DualPane } from "@/components/dual_pane";
import { Button } from "@/components/form/button";
import { IconMessage } from "@/components/message";
import { generateDisplayPicture } from "@/lib/display_picture";

import { Footer } from "./footer";
import { ShareGameplayBlock } from "./share_gameplay_block/share_gameplay_block";
import { SpectateItem } from "./spectate_item";
import { SpectatorIdBlock } from "./spectator_id_block";
import { WebSocketBlock } from "./websocket_block";

export const SpectatePage = React.memo(
  ({
    userId,
    broadcasts,
    remoteServerState,
    onRefreshBroadcasts,
    watchBroadcast,
    startRemoteServer,
    stopRemoteServer,
  }: {
    userId?: string;
    broadcasts: BroadcasterItem[];
    remoteServerState: { connected: boolean; started: boolean; port: number };
    onRefreshBroadcasts: () => void;
    watchBroadcast: (id: string) => void;
    startRemoteServer: (port: number) => Promise<{ success: boolean; err?: string }>;
    stopRemoteServer: () => Promise<void>;
  }) => {
    if (!userId) {
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
                  <Button startIcon={<SyncIcon />} onClick={onRefreshBroadcasts}>
                    Refresh
                  </Button>
                  <div
                    css={css`
                      padding-top: 20px;
                      padding-bottom: 20px;
                    `}
                  >
                    {broadcasts.length === 0 ? (
                      <IconMessage Icon={HelpOutlineIcon} label="No users are broadcasting to you" />
                    ) : (
                      broadcasts.map(({ id, broadcaster, name }) => {
                        return (
                          <SpectateItem
                            key={id}
                            broadcasterPicture={generateDisplayPicture(broadcaster.uid)}
                            broadcasterName={broadcaster.name}
                            name={name}
                            onWatch={() => watchBroadcast(id)}
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
                <SpectatorIdBlock userId={userId} />
                <ShareGameplayBlock />
                <WebSocketBlock
                  remoteServerState={remoteServerState}
                  startRemoteServer={startRemoteServer}
                  stopRemoteServer={stopRemoteServer}
                />
              </div>
            }
            style={{ gridTemplateColumns: "auto 400px" }}
          />
        </div>
        <Footer />
      </Outer>
    );
  },
);

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;
