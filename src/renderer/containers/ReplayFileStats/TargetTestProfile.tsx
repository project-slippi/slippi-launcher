import styled from "@emotion/styled";
import Typography from "@material-ui/core/Typography";
import { FileResult } from "@replays/types";
import { StatsType } from "@slippi/slippi-js";
import _ from "lodash";
import React from "react";

import { TargetTable } from "./TargetTable";

export interface GameProfileProps {
  file: FileResult;
  stats: StatsType;
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

export const TargetTestProfile: React.FC<GameProfileProps> = ({ file, stats }) => {
  const [firstPlayer] = file.settings.players;

  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Targets">
        <TargetTable file={file} stats={stats} player={firstPlayer} />
      </StatSection>
    </div>
  );
};
