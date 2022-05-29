import styled from "@emotion/styled";
import Typography from "@mui/material/Typography";
import type { FileResult } from "@replays/types";
import type { StatsType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import { KillTable } from "./KillTable";
import { OverallTable } from "./OverallTable";
import { PunishTable } from "./PunishTable";

export interface GameProfileProps {
  file: FileResult;
  stats: StatsType;
  onPlay: (options: { path: string; startFrame: number }) => void;
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

export const GameProfile: React.FC<GameProfileProps> = ({ file, stats, onPlay }) => {
  const [firstPlayer, secondPlayer] = file.settings.players;

  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Overall">
        <ErrorBoundary>
          <OverallTable file={file} stats={stats} />
        </ErrorBoundary>
      </StatSection>
      <StatSection title="Kills">
        <KillTable file={file} stats={stats} player={firstPlayer} opp={secondPlayer} onPlay={onPlay} />
        <KillTable file={file} stats={stats} player={secondPlayer} opp={firstPlayer} onPlay={onPlay} />
      </StatSection>
      <StatSection title="Openings &amp; Conversions">
        <PunishTable file={file} stats={stats} player={firstPlayer} opp={secondPlayer} onPlay={onPlay} />
        <PunishTable file={file} stats={stats} player={secondPlayer} opp={firstPlayer} onPlay={onPlay} />
      </StatSection>
    </div>
  );
};
