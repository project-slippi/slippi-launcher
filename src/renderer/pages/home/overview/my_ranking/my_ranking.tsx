import CachedIcon from "@mui/icons-material/Cached";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useMutation } from "@tanstack/react-query";
import React from "react";

import { useAccount } from "@/lib/hooks/use_account";
import { useServices } from "@/services";

import { ContentBlock } from "../content_block/content_block";
import { MyRankingMessages as Messages } from "./my_ranking.messages";
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
      endIcon={<RefreshRatingButton />}
      title={Messages.myRanking()}
      content={<RankedUserProfile rankedProfile={rankedProfile} />}
      fill={true}
    />
  );
});

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
    <Tooltip title={Messages.refresh()}>
      <IconButton
        disabled={mutation.isPending || !user}
        onClick={() => {
          if (!user) {
            return;
          }

          mutation.mutate(user.uid);
        }}
      >
        {mutation.isPending ? (
          <CircularProgress color="inherit" size={24} />
        ) : (
          <CachedIcon color="inherit" sx={{ fontSize: "24px", color: "var(--purple-light)" }} />
        )}
      </IconButton>
    </Tooltip>
  );
};
