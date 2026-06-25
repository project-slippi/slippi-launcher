import type { BroadcasterItem } from "@broadcast/types";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SyncIcon from "@mui/icons-material/Sync";
import React from "react";

import { DualPane } from "@/components/dual_pane";
import { Button } from "@/components/form/button";
import { IconMessage } from "@/components/message";
import { generateDisplayPicture } from "@/lib/display_picture";
import { useEnableSpectateRemoteControl } from "@/lib/hooks/use_settings";

import { AutoRefreshToggle } from "./auto_refresh_toggle/auto_refresh_toggle";
import { Footer } from "./footer/footer";
import { ShareGameplayBlock } from "./share_gameplay_block/share_gameplay_block";
import { SpectateItem } from "./spectate_item";
import { SpectatePageMessages as Messages } from "./spectate_page.messages";
import styles from "./spectate_page.module.css";
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
      <div className={styles.container}>
        <div className={styles.mainContentContainer}>
          <DualPane
            id="spectate-page"
            leftSide={
              <div className={styles.mainContent}>
                <h1>{Messages.spectate()}</h1>
                <div>
                  <div className={styles.refreshRow}>
                    <Button startIcon={<SyncIcon />} onClick={onRefreshBroadcasts}>
                      {Messages.refresh()}
                    </Button>
                    <AutoRefreshToggle onRefreshBroadcasts={onRefreshBroadcasts} />
                  </div>
                  <div className={styles.broadcastsList}>
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
              <div className={styles.sidebarContainer}>
                <SpectatorIdBlock userId={userId} />
                <ShareGameplayBlock />
                {enableSpectateRemoteControl && <SpectateRemoteControlBlockContainer />}
              </div>
            }
            style={{ gridTemplateColumns: "auto 400px" }}
          />
        </div>
        <Footer />
      </div>
    );
  },
);
