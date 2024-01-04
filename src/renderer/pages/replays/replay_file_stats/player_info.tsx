import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";

import { getColor } from "@/lib/player_colors";
import { getCharacterIcon } from "@/lib/utils";
import { withFont } from "@/styles/with_font";

type PlayerInfoProps = {
  isTeams: boolean;
  playerIndex: number;
  type?: number;
  teamId?: number;
  characterId?: number;
  characterColor?: number;
  connectCode?: string;
  displayName?: string;
  tag?: string;
};

export const PlayerInfo = ({
  isTeams,
  playerIndex,
  type,
  teamId,
  characterId,
  characterColor,
  connectCode,
  displayName,
  tag,
}: PlayerInfoProps) => {
  const port = playerIndex + 1;
  const backupName = type === 1 ? "CPU" : `Player ${port}`;
  const charIcon = getCharacterIcon(characterId ?? null, characterColor);
  return (
    <Outer>
      <div
        css={css`
          display: flex;
          img {
            align-self: center;
            width: 32px;
            margin-right: 8px;
          }
        `}
      >
        <img src={charIcon} />
      </div>
      <div
        css={css`
          display: flex;
          justify-content: center;
          flex-direction: column;
        `}
      >
        <div
          css={css`
            display: flex;
            align-items: center;
            font-family: ${withFont("Maven Pro")};
            font-size: 18px;
          `}
        >
          <span>{displayName || tag || backupName}</span>
          <span
            css={css`
              display: inline-block;
              color: ${colors.grayDark};
              font-weight: bold;
              background-color: ${getColor(port, isTeams ? teamId : undefined)};
              padding: 2px 6px;
              font-size: 12px;
              border-radius: 100px;
              margin-left: 5px;
            `}
          >
            P{port}
          </span>
        </div>
        {connectCode && (
          <div
            css={css`
              color: rgba(255, 255, 255, 0.6);
              font-size: 14px;
              font-weight: 500;
            `}
          >
            {connectCode}
          </div>
        )}
      </div>
    </Outer>
  );
};

const Outer = styled.div`
  margin: 0 10px;
  display: flex;
  font-size: 22px;
`;
