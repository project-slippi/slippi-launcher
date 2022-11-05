import { css } from "@emotion/react";
import React from "react";

import { getColor } from "@/lib/playerColors";
import { getCharacterIcon } from "@/lib/utils";
import { ReactComponent as CrownIcon } from "@/styles/images/crown.svg";

const WINNER_COLOR = "#ffb433";

type CommonPlayerBadgeProps = {
  characterId: number | null;
  characterColor: number | null;
  port: number;
  teamId?: number;
  isWinner?: boolean;
};

const InternalPlayerBadge = ({
  port,
  characterColor,
  characterId,
  teamId,
  isWinner,
  children,
}: React.PropsWithChildren<CommonPlayerBadgeProps>) => {
  const charIcon = getCharacterIcon(characterId, characterColor);
  const color = getColor(port, teamId);

  return (
    <div
      css={css`
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-left: 12px;
        background-color: ${color};
        border-radius: 100px;
        font-size: 13px;
        font-weight: 500;
        padding: 2px;
        ${isWinner ? `box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.9), 0 0 6px 3px ${WINNER_COLOR};` : ""}
      `}
    >
      <img
        src={charIcon}
        css={css`
          position: absolute;
          left: 0;
          width: 24px;
          margin-left: -12px;
        `}
      />
      <div
        css={css`
          background-color: rgba(0, 0, 0, 0.4);
          padding: 5px 15px;
          border-radius: 100px;
          white-space: nowrap;
        `}
      >
        {children}
      </div>
      {isWinner && (
        <div
          css={css`
            position: absolute;
            top: 0;
            right: 0;
            margin-top: -6px;
            transform: rotate(20deg);
          `}
        >
          <CrownIcon fill={WINNER_COLOR} style={{ height: 12 }} />
        </div>
      )}
    </div>
  );
};

type PlayerBadgeProps = CommonPlayerBadgeProps & {
  variant?: "code" | "tag";
  text: string;
};

export const PlayerBadge = React.memo(function PlayerBadge(props: PlayerBadgeProps) {
  const { variant = "tag", text, ...rest } = props;
  if (variant === "tag") {
    return (
      <InternalPlayerBadge {...rest}>
        <span>{text}</span>
      </InternalPlayerBadge>
    );
  }

  const [prefix, suffix] = text.split("#");
  return (
    <InternalPlayerBadge {...rest}>
      <span>{prefix}</span>
      <span
        css={css`
          color: rgba(255, 255, 255, 0.6);
        `}
      >
        #{suffix}
      </span>
    </InternalPlayerBadge>
  );
});
