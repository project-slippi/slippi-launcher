import styled from "@emotion/styled";
import React from "react";

import { PlayerBadge } from "./player_badge/PlayerBadge";

const Outer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > div {
    margin-right: 8px;
  }
`;

export type PlayerInfo = React.ComponentProps<typeof PlayerBadge>;

type TeamElementProps = {
  teams: PlayerInfo[][];
};

export const TeamElements = ({ teams }: TeamElementProps) => {
  const elements: React.ReactNode[] = [];
  teams.forEach((team, i) => {
    team.forEach((player) => {
      elements.push(<PlayerBadge key={`player-${player.port}`} {...player} />);
    });

    // Add VS obj in between teams
    if (i < teams.length - 1) {
      // If this is not the last team, add a "vs" element
      elements.push(
        <div key={`vs-${i}`} style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          vs
        </div>,
      );
    }
  });
  return <Outer>{elements}</Outer>;
};
