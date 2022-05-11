import { css } from "@emotion/react";
import styled from "@emotion/styled";
import type { GameStartType, MetadataType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

import { PlayerIndicator } from "@/components/PlayerIndicator";
import { extractPlayerNames } from "@/lib/matchNames";

const Outer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > div {
    margin-right: 8px;
  }
`;

export interface TeamElementProps {
  settings: GameStartType;
  metadata: MetadataType | null;
}

const PlayerCode: React.FC<{ code: string }> = ({ code }) => {
  const [text, numbers] = code.split("#");
  return (
    <React.Fragment>
      <span>{text}</span>
      <span
        css={css`
          color: rgba(255, 255, 255, 0.6);
        `}
      >
        #{numbers}
      </span>
    </React.Fragment>
  );
};

export const TeamElements: React.FC<TeamElementProps> = ({ settings, metadata }) => {
  // If this is a teams game, group by teamId, otherwise group players individually
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();

  const elements: JSX.Element[] = [];
  teams.forEach((team, idx) => {
    team.forEach((player) => {
      const backupName = player.type === 1 ? "CPU" : `Player ${player.playerIndex + 1}`;
      const names = extractPlayerNames(player.playerIndex, settings, metadata);
      elements.push(
        <PlayerIndicator key={`player-${player.playerIndex}`} player={player} isTeams={Boolean(settings.isTeams)}>
          {names.code ? <PlayerCode code={names.code} /> : <span>{names.tag || backupName}</span>}
        </PlayerIndicator>,
      );
    });

    // Add VS obj in between teams
    if (idx < teams.length - 1) {
      // If this is not the last team, add a "vs" element
      elements.push(
        <div key={`vs-${idx}`} style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          vs
        </div>,
      );
    }
  });
  return <Outer>{...elements}</Outer>;
};
