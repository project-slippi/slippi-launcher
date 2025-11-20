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
import { useEnableSpectateRemoteControl } from "@/lib/hooks/use_settings";

import { Footer } from "./footer/footer";
import { ShareGameplayBlock } from "./share_gameplay_block/share_gameplay_block";
import { SpectateItem } from "./spectate_item";
import { SpectatePageMessages as Messages } from "./spectate_page.messages";
import { SpectateRemoteControlBlockContainer } from "./spectate_remote_control_block/spectate_remote_control_block.container";
import { SpectatorIdBlock } from "./spectator_id_block/spectator_id_block";

export const SpectatePage = React.memo(
  ({
    userId,
    broadcasts,
    onRefreshBroadcasts,
    watchBroadcast,
  }: {
    userId?: string;
    broadcasts: BroadcasterItem[];
    onRefreshBroadcasts: () => void;
    watchBroadcast: (id: string) => void;
  }) => {
    const [enableSpectateRemoteControl] = useEnableSpectateRemoteControl();

    if (!userId) {
      return <IconMessage Icon={AccountCircleIcon} label={Messages.youMustBeLoggedIn()} />;
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
                <h1>{Messages.spectate()}</h1>
                <div>
                  <Button startIcon={<SyncIcon />} onClick={onRefreshBroadcasts}>
                    {Messages.refresh()}
                  </Button>
                  <div
                    css={css`
                      padding-top: 20px;
                      padding-bottom: 20px;
                    `}
                  >
                    {broadcasts.length === 0 ? (
                      <IconMessage Icon={HelpOutlineIcon} label={Messages.noUsers()} />
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
                {enableSpectateRemoteControl && <SpectateRemoteControlBlockContainer />}
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
