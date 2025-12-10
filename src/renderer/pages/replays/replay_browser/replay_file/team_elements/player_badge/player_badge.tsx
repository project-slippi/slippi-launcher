import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import { getColor } from "@/lib/player_colors";
import { getCharacterIcon } from "@/lib/utils";
import crownImage from "@/styles/images/crown.png";

type CommonPlayerBadgeProps = {
  characterId?: number;
  characterColor?: number;
  port: number;
  teamId?: number;
  isWinner?: boolean;
};

// Pre-styled components for better performance
const BadgeContainer = styled.div<{ color: string; isWinner: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 12px;
  background-color: ${(p) => p.color};
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  padding: 2px;
  ${(p) => (p.isWinner ? `box-shadow: 0px 0px 10px #6847BA;` : "")}
`;

const CharIcon = styled.img`
  position: absolute;
  left: 0;
  width: 24px;
  margin-left: -12px;
`;

const BadgeContent = styled.div`
  background-color: rgba(0, 0, 0, 0.4);
  padding: 5px 15px;
  border-radius: 100px;
  white-space: nowrap;
`;

const CrownContainer = styled.div`
  position: absolute;
  top: -4px;
  right: 0px;
`;

const InternalPlayerBadge = ({
  port,
  characterColor,
  characterId,
  teamId,
  isWinner,
  children,
}: React.PropsWithChildren<CommonPlayerBadgeProps>) => {
  const charIcon = getCharacterIcon(characterId ?? null, characterColor);
  const color = getColor(port, teamId);

  return (
    <BadgeContainer color={color} isWinner={!!isWinner}>
      <CharIcon src={charIcon} />
      <BadgeContent>{children}</BadgeContent>
      {isWinner && (
        <CrownContainer>
          <img src={crownImage} height={16} alt="winner" />
        </CrownContainer>
      )}
    </BadgeContainer>
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
