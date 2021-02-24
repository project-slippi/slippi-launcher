import { GlobalStats, MatchupAggregate } from "common/game";
import _ from "lodash";
import React from "react";

import { getCharacterIcon } from "@/lib/utils";

import * as T from "../ReplayFileStats/TableStyles";

export const OpponentTable: React.FC<{ stats: GlobalStats }> = ({ stats }) => {
  const renderHeaderPlayer = () => {
    const headerText = "Top Opponents";
    return (
      <T.TableRow>
        <T.TableHeaderCell colSpan={5}>{headerText}</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderHeaderColumns = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell>Player</T.TableHeaderCell>
        <T.TableHeaderCell>Games</T.TableHeaderCell>
        <T.TableHeaderCell>Winrate</T.TableHeaderCell>
        <T.TableHeaderCell>Characters</T.TableHeaderCell>
        <T.TableHeaderCell>Filters</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderRows = () => {
    const oppStats = stats.opponents;
    return Object.keys(oppStats)
      .sort((a, b) => oppStats[b].count - oppStats[a].count)
      .slice(0, 26)
      .map((k) => generateOpponentRow(k, oppStats[k]));
  };

  const generateOpponentRow = (playerTag: string, agg: MatchupAggregate) => {
    const chars = agg.charIds.map((charId: number) => (
      <T.GrayableImage key={charId} src={getCharacterIcon(charId, 0)} height={24} width={24} />
    ));

    return (
      <T.TableRow key={`${playerTag}-${agg.count}`}>
        <T.TableCell>{playerTag}</T.TableCell>
        <T.TableCell>{agg.count}</T.TableCell>
        <T.TableCell>{((agg.won / agg.count) * 100).toFixed(0)}%</T.TableCell>
        <T.TableCell>
          <div>{chars.slice(0, 5)}</div>
        </T.TableCell>
      </T.TableRow>
    );
  };

  return (
    <T.Table>
      {renderHeaderPlayer()}
      {renderHeaderColumns()}
      {renderRows()}
    </T.Table>
  );
};
