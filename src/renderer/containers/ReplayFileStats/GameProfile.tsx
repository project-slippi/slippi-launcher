import styled from "styled-components";
import React from "react";
import { FileResult } from "../../../common/replayBrowser/types";
import _ from "lodash";
import { StatsType } from "@slippi/slippi-js";
import { OverallTable } from "./OverallTable";
import { KillTable } from "./KillTable";
import { PunishTable } from "./PunishTable";

export interface GameProfileProps {
  file: FileResult;
  stats: StatsType;
}

const TableTitle = styled.h2`
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
`;

export const GameProfile: React.FC<GameProfileProps> = ({ file, stats }) => {
  const renderOverall = () => {
    return (
      <div>
        <TableTitle>Overall</TableTitle>
        <OverallTable file={file} stats={stats} />
      </div>
    );
  };

  const renderKills = () => {
    return (
      <div>
        <TableTitle>Kills</TableTitle>
        <div style={{ width: "100%" }}>
          <div style={{ display: "inline-block", verticalAlign: "top" }}>
            <KillTable file={file} stats={stats} playerIndex={0} />
          </div>
          <div style={{ display: "inline-block", verticalAlign: "top" }}>
            <KillTable file={file} stats={stats} playerIndex={1} />
          </div>
        </div>
      </div>
    );
  };

  const renderPunishes = () => {
    return (
      <div>
        <TableTitle>Openings &amp; Conversions</TableTitle>
        <div style={{ width: "100%", verticalAlign: "top" }}>
          <div style={{ display: "inline-block", verticalAlign: "top" }}>
            <PunishTable file={file} stats={stats} playerIndex={0} />
          </div>
          <div style={{ display: "inline-block", verticalAlign: "top" }}>
            <PunishTable file={file} stats={stats} playerIndex={1} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderOverall()}
      {renderKills()}
      {renderPunishes()}
    </div>
  );
};
