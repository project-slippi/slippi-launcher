import { characters } from "@slippi/slippi-js";
import { GlobalStats, MatchupAggregate } from "common/game";
import _ from "lodash";
import React from "react";

import { getCharacterIcon } from "@/lib/utils";

import * as T from "../ReplayFileStats/TableStyles";

const columnCount = 5;

export const CharacterTable: React.FC<{ stats: GlobalStats }> = ({ stats }) => {
  const opponent = false;

  const renderHeaderPlayer = () => {
    const headerText = `${opponent ? "Opponent" : "Player"} Characters`;
    return (
      <T.TableRow>
        <T.TableHeaderCell colSpan={columnCount}>{headerText}</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderHeaderColumns = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell>Character</T.TableHeaderCell>
        <T.TableHeaderCell>Games</T.TableHeaderCell>
        <T.TableHeaderCell>Winrate</T.TableHeaderCell>
        {opponent ? <T.TableHeaderCell>Players</T.TableHeaderCell> : null}
        <T.TableHeaderCell>Filters</T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderRows = () => {
    const charStats = stats.charIds;
    return Object.keys(charStats)
      .sort((a, b) => charStats[b].count - charStats[a].count)
      .map((k) => generateCharacterRow(Number(k), charStats[k]));
    // .slice(0,9)
  };

  const generateCharacterRow = (charId: number, agg: MatchupAggregate) => {
    const name = characters.getCharacterShortName(charId);
    const count = agg.count;
    const winrate = ((agg.won / agg.count) * 100).toFixed(0);

    return (
      <T.TableRow key={`${charId}-${count}`}>
        <T.TableCell>
          <T.GrayableImage src={getCharacterIcon(charId, 0)} height={24} width={24} />
          <div>{name}</div>
        </T.TableCell>
        <T.TableCell>{count}</T.TableCell>
        <T.TableCell>{winrate}%</T.TableCell>
        {opponent ? <T.TableCell>{agg.unique.length}</T.TableCell> : null}
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
