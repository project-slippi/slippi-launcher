import React from "react";

import { getRankIcon } from "@/components/rank_icon/rank_icon";
import type { Rank, RankedProfile } from "@/services/slippi/types";

import { getRankDetails } from "./get_rank_details";
import { MyRankingMessages as Messages } from "./my_ranking.messages";
import styles from "./ranked_user_profile.module.css";

export const RankedUserProfile = ({ rankedProfile }: { rankedProfile: RankedProfile }) => {
  const { rating, rank } = rankedProfile;
  const { name, color } = getRankDetails(rank);
  const isUnrankedRank = isUnranked(rank);

  const rankNameLabel = React.useMemo(() => {
    if (rank === "pending") {
      return Messages.rankPending();
    }
    if (isUnrankedRank) {
      return Messages.noRanking();
    }
    return name;
  }, [rank, isUnrankedRank, name]);

  return (
    <div className={styles.container}>
      <div
        className={styles.iconContainer}
        style={{
          backgroundImage: `url(${getRankIcon(rank)})`,
        }}
      />
      <div
        className={styles.gradientContainer}
        style={{
          background: `linear-gradient(to right, transparent 20%, ${color} 175%)`,
        }}
      />
      <div className={styles.ratingContainer}>
        <h3 className={styles.rankNameLabel}>{rankNameLabel}</h3>
        {!isUnrankedRank && <div style={{ color, fontWeight: "bold" }}>{rating}</div>}
      </div>
    </div>
  );
};

function isUnranked(rank: Rank) {
  return rank === "none" || rank === "banned" || rank === "pending";
}
