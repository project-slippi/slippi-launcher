import { Button } from "@base-ui/react";
import CachedIcon from "@mui/icons-material/Cached";
import CircularProgress from "@mui/material/CircularProgress";
import { useMutation } from "@tanstack/react-query";
import React from "react";

import { useAccount } from "@/lib/hooks/use_account";
import { useServices } from "@/services";
import type { Rank, RankedProfile } from "@/services/slippi/types";

import { getRankDetails } from "./get_rank_details";
import { getRankIcon } from "./get_rank_icon";
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
      <div className={styles.content}>
        <div>
          <h3 className={styles.rankNameLabel}>{rankNameLabel}</h3>
          {!isUnrankedRank && <div style={{ color, fontWeight: "bold" }}>{rating}</div>}
        </div>
        <RefreshRatingButton />
      </div>
    </div>
  );
};

function isUnranked(rank: Rank) {
  return rank === "none" || rank === "banned" || rank === "pending";
}

const RefreshRatingButton = () => {
  const updateRanking = useAccount((s) => s.updateRanking);
  const user = useAccount((s) => s.user);

  const { slippiBackendService } = useServices();

  const mutation = useMutation({
    mutationFn: async (uid: string) => {
      const profile = await slippiBackendService.fetchRankedNetplayProfile(uid);

      // protect against auth changes during request
      if (user?.uid !== uid) {
        return;
      }

      if (profile) {
        updateRanking(profile);
      }

      return profile;
    },
  });

  return (
    <Button
      className={styles.refreshButton}
      disabled={mutation.isPending || !user}
      onClick={() => {
        if (!user) {
          return;
        }

        mutation.mutate(user.uid);
      }}
    >
      {mutation.isPending ? (
        <CircularProgress color="inherit" size={16} />
      ) : (
        <CachedIcon color="inherit" sx={{ fontSize: "16px", color: "var(--purple-light)" }} />
      )}
      <span>{Messages.refresh()}</span>
    </Button>
  );
};
