import { colors } from "@common/colors";
import { css } from "@emotion/react";
import CircularProgress from "@mui/material/CircularProgress";
import * as React from "react";

import { UserIcon } from "@/components/UserIcon";

export const UserInfo = React.memo(function UserInfo({
  displayName,
  displayPicture,
  connectCode,
  errorMessage,
  loading,
}: {
  displayName: string;
  displayPicture: string;
  connectCode?: string;
  errorMessage?: string;
  loading?: boolean;
}) {
  const subtext = errorMessage ? errorMessage : connectCode || "";

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
      {loading ? <CircularProgress color="inherit" /> : <UserIcon imageUrl={displayPicture} size={38} />}
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
              color: ${errorMessage ? "red" : colors.purpleLight};
            `}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
});
