import React from "react";

import { useAccount } from "@/lib/hooks/use_account";
import { useEnableRankDisplay } from "@/lib/hooks/use_settings";
import { useServices } from "@/services";

import { ContentBlock } from "../content_block/content_block";
import { MyRankingMessages as Messages } from "./my_ranking.messages";
import styles from "./my_ranking.module.css";
import { RankedUserProfile } from "./ranked_user_profile";

export const MyRanking = React.memo(function MyRanking() {
  const { notificationService } = useServices();
  const [enableRankDisplay, setEnableRankDisplay] = useEnableRankDisplay();

  // We update just the rankedNetplayProfile on refresh so we should make sure
  // the selector is correct to ensure the UI updates as expected.
  const rankedProfile = useAccount((store) => store.userData?.rankedNetplayProfile);
  if (!enableRankDisplay || !rankedProfile) {
    return null;
  }

  const onHide = () => {
    void setEnableRankDisplay(false).then(() => {
      notificationService.showInfo(Messages.rankingHiddenNotification());
    });
  };

  return (
    <ContentBlock
      overflowY="hidden"
      content={
        <div className={styles.myRankingContainer}>
          <RankedUserProfile rankedProfile={rankedProfile} onHide={onHide} />
        </div>
      }
    />
  );
});
