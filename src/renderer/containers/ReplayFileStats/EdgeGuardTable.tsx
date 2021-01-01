import { ComboType, StatsType } from "@slippi/slippi-js/dist/stats/common";
import { FileResult } from "../../../common/replayBrowser/types";
import React from "react";
import { convertFrameCountToDurationString } from "../../../common/time";
import * as T from "./TableStyles";
import _ from "lodash";
import { extractPlayerNames } from "common/matchNames";
import { getCharacterIcon } from "@/lib/utils";

export interface EdgeGuardTableProps {
  file: FileResult;
  stats: StatsType | null;
  playerIndex: number;
}
export const EdgeGuardTable: React.FC<EdgeGuardTableProps> = ({
  file,
  stats,
  playerIndex,
}) => {
  const player = file.settings.players[playerIndex];
  const playerName = extractPlayerNames(
    playerIndex,
    file.settings,
    file.metadata
  );
  const playerDisplay = (
    <div style={{ display: "inline-block" }}>
      <div style={{ display: "inline-block", margin: "10px 10px" }}>
        {playerName.name}
      </div>
      <img
        src={getCharacterIcon(
          player.characterId ?? 0,
          player.characterColor ?? 0
        )}
        height={24}
        width={24}
        style={{
          marginRight: "0px",
          marginTop: "8px",
          position: "absolute",
        }}
      />
    </div>
  );

  const generateEdgeguardRow = (edgeguard: ComboType) => {
    const start = convertFrameCountToDurationString(edgeguard.startFrame);
    let end = "–";

    if (edgeguard.endFrame) {
      end = convertFrameCountToDurationString(edgeguard.endFrame);
    }

    return (
      <T.TableRow
        key={`${edgeguard.playerIndex}-edgeguard-${edgeguard.startFrame}`}
      >
        <T.TableCell>{start}</T.TableCell>
        <T.TableCell>{end}</T.TableCell>
      </T.TableRow>
    );
  };

  const renderHeaderPlayer = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell colSpan={2}>{playerDisplay}</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderHeaderColumns = () => {
    return (
      <T.TableRow>
        <T.TableSubHeaderCell>Start</T.TableSubHeaderCell>
        <T.TableSubHeaderCell>End</T.TableSubHeaderCell>
      </T.TableRow>
    );
  };

  const renderEdgeguardRows = () => {
    const edgeguards = _.get(stats, ["events", "edgeguards"]) || [];
    const edgeguardsByPlayer = _.groupBy(edgeguards, "playerIndex");
    const playerEdgeguards = edgeguardsByPlayer[playerIndex] || [];

    console.log("egeguards");
    console.log(stats);
    return playerEdgeguards.map(generateEdgeguardRow);
  };
  return (
    <div style={{ width: "510px" }}>
      <T.Table>
        <thead>
          {renderHeaderPlayer()}
          {renderHeaderColumns()}
        </thead>

        <tbody>{renderEdgeguardRows()}</tbody>
      </T.Table>
    </div>
  );
};
