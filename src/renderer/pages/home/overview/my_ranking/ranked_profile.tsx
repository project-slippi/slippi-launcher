import { clsx } from "clsx";

import { getRankIcon } from "@/components/rank_icon/rank_icon";
import { useAccount } from "@/lib/hooks/use_account";
import type { Rank } from "@/services/slippi/types";

import { getRankDetails } from "./get_rank_details";
import styles from "./ranked_profile.module.css";

export const RankedProfile = () => {
  // We update just the rankedNetplayProfile on refresh so we should make sure
  // the selector is correct to ensure the UI updates as expected.
  const rankedProfile = useAccount((store) => store.userData?.rankedNetplayProfile);
  if (!rankedProfile) {
    return null;
  }

  const { rating, rank } = rankedProfile;
  const { name, color } = getRankDetails(rank);
  const isUnrankedRank = isUnranked(rank);

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
        <h3
          className={clsx(styles.rankNameLabel, {
            [styles.uppercase]: isUnrankedRank,
          })}
        >
          {name}
        </h3>
        {!isUnrankedRank && <div style={{ color, fontWeight: "bold" }}>{rating}</div>}
      </div>
    </div>
  );
};

function isUnranked(rank: Rank) {
  return rank === "none" || rank === "banned" || rank === "pending";
}
