/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import { PlayerType } from "@slippi/slippi-js";
import { getPortColor, getTeamColor } from "common/colors";
import _ from "lodash";
import React from "react";

import { getCharacterIcon } from "@/lib/utils";

function getColor(port: number, teamId: number | null) {
  if (teamId !== null) {
    return getTeamColor(teamId);
  }
  return getPortColor(port);
}

export interface PlayerIndicatorProps {
  player: PlayerType;
  isTeams?: boolean;
}

export const PlayerIndicator: React.FC<PlayerIndicatorProps> = ({ player, children, isTeams }) => {
  const charIcon = getCharacterIcon(player.characterId, player.characterColor);
  const teamId = isTeams ? player.teamId : null;
  const color = getColor(player.port, teamId);

  return (
    <div
      css={css`
        position: relative;
        display: flex;
        align-items: center;
        margin-left: 12px;
        background-color: ${color};
        border-radius: 100px;
        font-size: 13px;
        font-weight: 500;
        padding: 2px;
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
          background-color: rgba(0, 0, 0, 0.3);
          padding: 5px 15px;
          border-radius: 100px;
        `}
      >
        {children}
      </div>
    </div>
  );
};
