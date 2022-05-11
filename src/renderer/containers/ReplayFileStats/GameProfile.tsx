import styled from "@emotion/styled";
import Typography from "@mui/material/Typography";
import type { FileDetails, FileHeader } from "@replays/types";
import type { StatsType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import { KillTable } from "./KillTable";
import { OverallTable } from "./OverallTable";
import { PunishTable } from "./PunishTable";

export interface GameProfileProps {
  fileHeader: FileHeader;
  fileDetails: FileDetails;
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

export const GameProfile: React.FC<GameProfileProps> = ({ fileHeader, fileDetails, stats, onPlay }) => {
  const [firstPlayer, secondPlayer] = fileDetails.settings.players;

  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Overall">
        <ErrorBoundary>
          <OverallTable file={fileDetails} stats={stats} />
        </ErrorBoundary>
      </StatSection>
      <StatSection title="Kills">
        <KillTable
          fileHeader={fileHeader}
          fileDetails={fileDetails}
          stats={stats}
          player={firstPlayer}
          opp={secondPlayer}
          onPlay={onPlay}
        />
        <KillTable
          fileHeader={fileHeader}
          fileDetails={fileDetails}
          stats={stats}
          player={secondPlayer}
          opp={firstPlayer}
          onPlay={onPlay}
        />
      </StatSection>
      <StatSection title="Openings &amp; Conversions">
        <PunishTable
          fileHeader={fileHeader}
          fileDetails={fileDetails}
          stats={stats}
          player={firstPlayer}
          opp={secondPlayer}
          onPlay={onPlay}
        />
        <PunishTable
          fileHeader={fileHeader}
          fileDetails={fileDetails}
          stats={stats}
          player={secondPlayer}
          opp={firstPlayer}
          onPlay={onPlay}
        />
      </StatSection>
    </div>
  );
};
