/** @jsx jsx */
import { colors } from "@common/colors";
import type { PlayKey } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import CircularProgress from "@material-ui/core/CircularProgress";
import React from "react";

import { UserIcon } from "@/components/UserIcon";

export const UserInfo: React.FC<{
  uid: string;
  displayName: string | null;
  playKey: PlayKey | null;
  serverError: boolean | null;
  loading: boolean;
}> = ({ uid, displayName, playKey, serverError, loading }) => {
  const showError = serverError || !playKey;
  let subtext = "";
  if (serverError) {
    subtext = "Slippi server error";
  } else if (!playKey) {
    subtext = "Online activation required";
  } else {
    subtext = playKey.connectCode;
  }

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        color: white;

        @media (min-width: 800px) {
          min-width: 250px;
        }
      `}
    >
      {loading ? <CircularProgress color="inherit" /> : <UserIcon userId={uid} size={38} />}
      <div
        css={css`
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-left: 10px;

          @media (max-width: 800px) {
            display: none;
          }

          h3 {
            margin: 0;
            margin-bottom: 6px;
            font-size: 18px;
          }
        `}
      >
        <h3>{displayName}</h3>
        {!loading && (
          <div
            css={css`
              font-weight: bold;
              font-size: 14px;
              color: ${showError ? "red" : colors.purpleLight};
            `}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};
