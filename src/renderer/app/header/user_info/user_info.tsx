import { css } from "@emotion/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";

import { UserIcon } from "@/components/user_icon";

import { SupportBadge } from "./support_badge";

export const UserInfo = React.memo(function UserInfo({
  displayName,
  displayPicture,
  connectCode,
  errorMessage,
  tier = "NONE",
  isVip,
  loading,
}: {
  displayName: string;
  displayPicture: string;
  tier?: "TIER1" | "TIER2" | "TIER3" | "NONE";
  isVip?: boolean;
  connectCode?: string;
  errorMessage?: string;
  loading?: boolean;
}) {
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        color: white;
        padding: 8px 10px;
      `}
    >
      {loading ? <CircularProgress color="inherit" /> : <UserIcon imageUrl={displayPicture} size={42} />}
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
        {!loading &&
          (errorMessage ? (
            <div
              css={css`
                font-weight: bold;
                font-size: 14px;
                color: red;
              `}
            >
              {errorMessage}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                css={css`
                  font-weight: bold;
                  font-size: 14px;
                  color: var(--purple-light);
                `}
              >
                {connectCode}
              </span>
              {tier !== "NONE" && <SupportBadge tier={tier} isVip={isVip} />}
            </div>
          ))}
      </div>
      <div
        css={css`
          color: var(--purple-lighter);
          margin-left: 16px;
        `}
      >
        <ExpandMoreIcon />
      </div>
    </div>
  );
});
