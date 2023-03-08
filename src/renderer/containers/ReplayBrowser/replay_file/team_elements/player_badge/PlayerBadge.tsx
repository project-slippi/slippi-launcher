import { css } from "@emotion/react";
import React, { useState } from "react";

import { getColor } from "@/lib/playerColors";
import { getCharacterIcon } from "@/lib/utils";
import crownImage from "@/styles/images/crown.png";

const SLIPPI_PROFILE_URL_PREFIX = "https://slippi.gg/profile";

type CommonPlayerBadgeProps = {
  characterId: number | null;
  characterColor: number | null;
  port: number;
  teamId?: number;
  isWinner?: boolean;
  clickHandler?: React.MouseEventHandler;
};

const InternalPlayerBadge = ({
  port,
  characterColor,
  characterId,
  teamId,
  isWinner,
  clickHandler,
  children,
}: React.PropsWithChildren<CommonPlayerBadgeProps>) => {
  const charIcon = getCharacterIcon(characterId, characterColor);
  const color = getColor(port, teamId);

  const [isHovered, setIsHovered] = useState(false);

  let boxShadow = "";
  if (isHovered && clickHandler != null) {
    boxShadow = "0px 0px 10px 5px #34D5EB;";
  } else if (isWinner) {
    boxShadow = "0px 0px 10px #6847BA;";
  }

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
        box-shadow: ${boxShadow};
      `}
      onClick={clickHandler}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
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
            top: -4px;
            right: 0px;
          `}
        >
          <img src={crownImage} height={16} />
        </div>
      )}
    </div>
  );
};

type PlayerBadgeProps = CommonPlayerBadgeProps & {
  variant?: "code" | "tag";
  text: string;
};

const computeProfileURL = (prefix: string, suffix: string): string | null => {
  if (prefix == null || suffix == null) {
    return null;
  }

  return `${SLIPPI_PROFILE_URL_PREFIX}/${prefix}-${suffix}`;
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
  const profileUrl = computeProfileURL(prefix, suffix);

  // populate the child props with a click handler
  // this allows the entire div to be clickable
  rest.clickHandler =
    profileUrl == null
      ? undefined
      : async (e: React.MouseEvent) => {
          e.preventDefault();
          // prevent click from affecting the parent
          e.stopPropagation();
          await window.open(profileUrl);
        };

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
