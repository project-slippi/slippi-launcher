/** @jsx jsx */
import { PlayKey } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import { CircularProgress } from "@material-ui/core";
import { colors } from "common/colors";
import firebase from "firebase";
import React from "react";

import { UserIcon } from "@/components/UserIcon";

export const UserInfo: React.FC<{
  user: firebase.User;
  playKey: PlayKey | null;
  loading: boolean;
}> = ({ user, playKey, loading }) => {
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
      {loading ? <CircularProgress color="inherit" /> : <UserIcon userId={user.uid} size="38px" />}
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
        <h3>{user.displayName}</h3>
        {!loading && (
          <div
            css={css`
              font-weight: bold;
              font-size: 14px;
              color: ${playKey ? colors.purpleLight : "red"};
            `}
          >
            {playKey ? playKey.connectCode : "Online activation required"}
          </div>
        )}
      </div>
    </div>
  );
};
