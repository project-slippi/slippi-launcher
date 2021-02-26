import { Checkbox, Link } from "@material-ui/core";
import { characters } from "@slippi/slippi-js";
import { GlobalStats, MatchupAggregate } from "common/game";
import _ from "lodash";
import React, { useState } from "react";

import { getCharacterIcon } from "@/lib/utils";

import * as T from "../ReplayFileStats/TableStyles";

export const CharacterTable: React.FC<{
  opponent: boolean;
  stats: GlobalStats;
  setFiltered: (f: number[]) => void;
}> = ({ opponent, stats, setFiltered }) => {
  const [selected, setSelected] = useState([] as number[]);
  const [focused, setFocused] = useState([] as number[]);
  const [hidden, setHidden] = useState([] as number[]);

  const setFocus = () => {
    setFocused([...selected, ...focused]);
    setSelected([]);
    setFiltered(hidden);
  };

  const setHide = () => {
    setHidden([...selected, ...hidden]);
    setSelected([]);
    setFiltered(hidden);
  };

  const setClear = () => {
    setFocused([]);
    setHidden([]);
    setSelected([]);
    setFiltered([]);
  };

  const setCheck = (isChecked: boolean, player: number) => {
    if (isChecked) {
      setSelected([...selected, player]);
    } else {
      setSelected(selected.filter((p) => p !== player));
    }
  };

  const renderFilterControls = () => {
    return selected.length > 0 ? (
      <div style={{ alignSelf: "right" }}>
        <Link onClick={setClear}>Clear</Link> / <Link onClick={setFocus}>Focus</Link> /{" "}
        <Link onClick={setHide}>Hide</Link>
      </div>
    ) : null;
  };

  const columnCount = opponent ? 5 : 4;

  const renderHeaderPlayer = () => {
    const headerText = `${opponent ? "Opponent" : "Player"} Characters`;
    return (
      <T.TableRow>
        <T.TableHeaderCell colSpan={columnCount}>
          <div style={{ display: "flex" }}>
            {headerText}
            {renderFilterControls()}
          </div>
        </T.TableHeaderCell>
      </T.TableRow>
    );
  };

  const renderHeaderColumns = () => {
    return (
      <T.TableRow>
        <T.TableHeaderCell></T.TableHeaderCell>
        <T.TableHeaderCell>Character</T.TableHeaderCell>
        <T.TableHeaderCell>Games</T.TableHeaderCell>
        <T.TableHeaderCell>Winrate</T.TableHeaderCell>
        {opponent ? <T.TableHeaderCell>Players</T.TableHeaderCell> : null}
      </T.TableRow>
    );
  };

  const renderRows = () => {
    const charStats = opponent ? stats.opponentChars : stats.charIds;
    return Object.keys(charStats)
      .sort((a, b) => charStats[b].count - charStats[a].count)
      .map((k) => generateCharacterRow(Number(k), charStats[k]))
      .slice(0, 9);
  };

  const generateCharacterRow = (charId: number, agg: MatchupAggregate) => {
    const name = characters.getCharacterShortName(charId);
    const count = agg.count;
    const winrate = ((agg.won / agg.count) * 100).toFixed(0);

    return (
      <T.TableRow key={`${charId}-${count}`}>
        <T.TableCell style={{ alignItems: "center" }}>
          <Checkbox
            color="default"
            checked={selected.includes(charId)}
            onChange={(e) => setCheck(e.target.checked, charId)}
          />
        </T.TableCell>
        <T.TableCell>
          <div style={{ display: "flex", alignItems: "center" }}>
            <T.GrayableImage src={getCharacterIcon(charId, 0)} height={24} width={24} />
            <div>{name}</div>
          </div>
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
