import styled from "@emotion/styled";
import Typography from "@material-ui/core/Typography";
import { FileResult } from "@replays/types";
import { GameStartType, StatsType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import { KillTable } from "./KillTable";
import { OverallTable } from "./OverallTable";
import { PunishTable } from "./PunishTable";

export interface GameProfileProps {
  file: FileResult;
  stats: StatsType;
  settings: GameStartType;
}

const TableContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  grid-gap: 20px;
`;

const StatSection: React.FC<{
  title: string;
}> = (props) => {
  return (
    <div style={{ padding: 10 }}>
      <Typography variant="h5" style={{ marginBottom: 10 }}>
        {props.title}
      </Typography>
      <TableContainer>{props.children}</TableContainer>
    </div>
  );
};

export const GameProfile: React.FC<GameProfileProps> = ({ file, stats, settings }) => {
  // return an array with the
  const getPlayerIndexes = (isFirstPlayer: boolean): number[] => {
    const players = settings.players;
    const player = isFirstPlayer ? players[0] : players[1];
    const opp = isFirstPlayer ? players[1] : players[0];
    return [player.playerIndex, opp.playerIndex];
  };

  const firstPlayer = getPlayerIndexes(true);
  const secondPlayer = getPlayerIndexes(false);

  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Overall">
        <ErrorBoundary>
          <OverallTable file={file} stats={stats} />
        </ErrorBoundary>
      </StatSection>
      <StatSection title="Kills">
        <KillTable file={file} stats={stats} playerIndex={firstPlayer[0]} oppIndex={firstPlayer[1]} />
        <KillTable file={file} stats={stats} playerIndex={secondPlayer[0]} oppIndex={secondPlayer[1]} />
      </StatSection>
      <StatSection title="Openings &amp; Conversions">
        <PunishTable file={file} stats={stats} playerIndex={firstPlayer[0]} oppIndex={firstPlayer[1]} />
        <PunishTable file={file} stats={stats} playerIndex={secondPlayer[0]} oppIndex={secondPlayer[1]} />
      </StatSection>
    </div>
  );
};
