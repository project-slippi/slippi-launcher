import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { PlayerType } from "@slippi/slippi-js";
import React from "react";

import type { PlayerNames } from "@/lib/matchNames";
import { getColor } from "@/lib/playerColors";
import { getCharacterIcon } from "@/lib/utils";
import { withFont } from "@/styles/withFont";

export interface PlayerInfoProps {
  player: PlayerType;
  names: PlayerNames;
  isTeams?: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, names, isTeams }) => {
  const backupName = player.type === 1 ? "CPU" : `Player ${player.port}`;
  const charIcon = getCharacterIcon(player.characterId, player.characterColor);
  const teamId = isTeams ? player.teamId : null;
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
          <span>{names.name || names.tag || backupName}</span>
          <span
            css={css`
              display: inline-block;
              color: ${colors.grayDark};
              font-weight: bold;
              background-color: ${getColor(player.port, teamId ?? undefined)};
              padding: 2px 6px;
              font-size: 12px;
              border-radius: 100px;
              margin-left: 5px;
            `}
          >
            P{player.port}
          </span>
        </div>
        {names.code && (
          <div
            css={css`
              color: rgba(255, 255, 255, 0.6);
              font-size: 14px;
              font-weight: 500;
            `}
          >
            {names.code}
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
