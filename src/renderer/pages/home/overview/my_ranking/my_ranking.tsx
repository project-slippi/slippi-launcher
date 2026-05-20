import React from "react";

import { useAccount } from "@/lib/hooks/use_account";

import { ContentBlock } from "../content_block/content_block";
import styles from "./my_ranking.module.css";
import { RankedUserProfile } from "./ranked_user_profile";

export const MyRanking = React.memo(function MyRanking() {
  // We update just the rankedNetplayProfile on refresh so we should make sure
  // the selector is correct to ensure the UI updates as expected.
  const rankedProfile = useAccount((store) => store.userData?.rankedNetplayProfile);
  if (!rankedProfile) {
    return null;
  }

  return (
    <ContentBlock
      content={
        <div className={styles.myRankingContainer}>
          <RankedUserProfile rankedProfile={rankedProfile} />
        </div>
      }
    />
  );
});
