import type { FileResult } from "@replays/types";
import type { StatsType } from "@slippi/slippi-js";
import React from "react";

import { getCharacterIcon } from "@/lib/utils";

import * as T from "../table_components";
import type {
  CountPercentRow,
  MultiRow,
  PercentFractionRow,
  Section,
  SimpleRatioRow,
  StatRow,
} from "./stat_definitions";

const columnCount = 5;

function higherHighlight(a: number, b: number): boolean {
  const oppIsNull = a && Number.isNaN(b);
  return oppIsNull || a > b;
}

function lowerHighlight(a: number, b: number): boolean {
  const oppIsNull = a && Number.isNaN(b);
  return oppIsNull || a < b;
}

function resolveHighlight(
  highlight: SimpleRatioRow["highlight"] | PercentFractionRow["highlight"],
  a: number,
  b: number,
): boolean {
  if (typeof highlight === "function") {
    return highlight(a, b);
  }
  return highlight === "higher" ? higherHighlight(a, b) : lowerHighlight(a, b);
}

// Multi-row renderer

function renderMultiRow(row: MultiRow, stats: StatsType): JSX.Element {
  const key = `stat-${row.label}`;
  const arr = (stats as any)?.[row.path] ?? [];

  if (!arr || arr.length === 0) {
    return (
      <T.TableRow key={key}>
        <T.TableCell>{row.label}</T.TableCell>
        <T.TableCell>Team Battle is not supported for this field</T.TableCell>
      </T.TableRow>
    );
  }

  const player1Item = row.subKey ? arr[0]?.[row.subKey] ?? {} : arr[0] ?? {};
  const player2Item = row.subKey ? arr[1]?.[row.subKey] ?? {} : arr[1] ?? {};

  const generateValues = (item: any) => {
    if (row.fields) {
      return row.fields.map((f) => {
        const v = item[f];
        return row.valueMapper ? row.valueMapper(v) : v;
      });
    }
    if (row.valueMapper) {
      return [row.valueMapper(item)];
    }
    return [item];
  };

  const p1Values = generateValues(player1Item);
  const p2Values = generateValues(player2Item);

  return (
    <T.TableRow key={key}>
      <T.TableCell>{row.label}</T.TableCell>
      <T.TableCell highlight={row.highlight?.(p1Values, p2Values) ?? false}>
        <div>{p1Values.join(" / ")}</div>
      </T.TableCell>
      <T.TableCell highlight={row.highlight?.(p2Values, p1Values) ?? false}>
        <div>{p2Values.join(" / ")}</div>
      </T.TableCell>
    </T.TableRow>
  );
}

// Simple ratio renderer

function renderSimpleRatioRow(row: SimpleRatioRow, stats: StatsType): JSX.Element {
  const key = `stat-${row.label}`;
  const arr = (stats as any)?.[row.path] ?? [];
  const player1Item = arr[0] ?? {};
  const player2Item = arr[1] ?? {};

  const renderCell = (item: any, oppItem: any) => {
    const ratio = item[row.field]?.ratio;
    const oppRatio = oppItem[row.field]?.ratio;

    if (ratio == null) {
      return (
        <T.TableCell>
          <div>N/A</div>
        </T.TableCell>
      );
    }
    const fixedRatio = ratio.toFixed(1);
    const fixedOpp = oppRatio != null ? oppRatio.toFixed(1) : "Infinity";
    return (
      <T.TableCell highlight={resolveHighlight(row.highlight, parseFloat(fixedRatio), parseFloat(fixedOpp))}>
        <div>{fixedRatio}</div>
      </T.TableCell>
    );
  };

  return (
    <T.TableRow key={key}>
      <T.TableCell>{row.label}</T.TableCell>
      {renderCell(player1Item, player2Item)}
      {renderCell(player2Item, player1Item)}
    </T.TableRow>
  );
}

// Percent-fraction renderer

function renderPercentFractionRow(row: PercentFractionRow, stats: StatsType): JSX.Element {
  const key = `stat-${row.label}`;
  const arr = (stats as any)?.[row.path] ?? [];
  const player1Item = arr[0] ?? {};
  const player2Item = arr[1] ?? {};

  const renderCell = (item: any, oppItem: any) => {
    const ratioObj = item[row.field];
    const oppRatioObj = oppItem[row.field];
    const playerRatio = ratioObj?.ratio;
    const oppRatioValue = oppRatioObj?.ratio;

    if (playerRatio == null || oppRatioValue == null) {
      return (
        <T.TableCell>
          <div>N/A</div>
        </T.TableCell>
      );
    }
    const fixedRatio = playerRatio.toFixed(3);
    const fixedOpp = oppRatioValue.toFixed(3);
    const playerCount = ratioObj.count;
    const playerTotal = ratioObj.total;

    return (
      <T.TableCell highlight={resolveHighlight(row.highlight, parseFloat(fixedRatio), parseFloat(fixedOpp))}>
        <div>
          <span style={{ display: "inline-block", marginRight: "8px" }}>{Math.round(playerRatio * 1000) / 10}%</span>
          <span style={{ display: "inline-block" }}>
            ({playerCount} / {playerTotal})
          </span>
        </div>
      </T.TableCell>
    );
  };

  return (
    <T.TableRow key={key}>
      <T.TableCell>{row.label}</T.TableCell>
      {renderCell(player1Item, player2Item)}
      {renderCell(player2Item, player1Item)}
    </T.TableRow>
  );
}

// Count-percent renderer

function renderCountPercentRow(row: CountPercentRow, stats: StatsType): JSX.Element {
  const key = `stat-${row.label}`;
  const arr = (stats as any)?.[row.path] ?? [];
  const player1Item = arr[0] ?? {};
  const player2Item = arr[1] ?? {};

  const renderCell = (item: any, oppItem: any) => {
    const ratioObj = item[row.field];
    const oppRatioObj = oppItem[row.field];
    const playerCount = ratioObj?.count ?? 0;
    const playerRatio = ratioObj?.ratio;
    const oppCount = oppRatioObj?.count ?? 0;

    const secondaryDisplay =
      playerRatio != null ? <span style={{ display: "inline-block" }}>({Math.round(playerRatio * 100)}%)</span> : null;

    return (
      <T.TableCell highlight={row.highlight?.(playerCount, oppCount) ?? false}>
        <div>
          <span style={{ display: "inline-block", marginRight: "8px" }}>{playerCount}</span>
          {secondaryDisplay}
        </div>
      </T.TableCell>
    );
  };

  return (
    <T.TableRow key={key}>
      <T.TableCell>{row.label}</T.TableCell>
      {renderCell(player1Item, player2Item)}
      {renderCell(player2Item, player1Item)}
    </T.TableRow>
  );
}

// Public API

export function renderPlayerHeaders(file: FileResult): JSX.Element {
  return (
    <thead>
      <T.TableRow>
        <T.TableHeaderCell />
        {file.game.players.map((p) => (
          <T.TableHeaderCell key={p.playerIndex}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={getCharacterIcon(p.characterId, p.characterColor)}
                height={24}
                width={24}
                style={{ marginRight: 10 }}
              />
              <div style={{ fontWeight: 500 }}>{p.displayName || p.tag || `Player ${p.playerIndex + 1}`}</div>
            </div>
          </T.TableHeaderCell>
        ))}
      </T.TableRow>
    </thead>
  );
}

export function renderStatRow(row: StatRow, stats: StatsType): JSX.Element {
  switch (row.kind) {
    case "multi":
      return renderMultiRow(row, stats);
    case "simple-ratio":
      return renderSimpleRatioRow(row, stats);
    case "percent-fraction":
      return renderPercentFractionRow(row, stats);
    case "count-percent":
      return renderCountPercentRow(row, stats);
  }
}

export function renderSection(section: Section, stats: StatsType): React.ReactNode {
  return (
    <React.Fragment key={section.title}>
      <thead>
        <tr>
          <T.TableSubHeaderCell colSpan={columnCount}>{section.title}</T.TableSubHeaderCell>
        </tr>
      </thead>
      <tbody>{section.rows.map((row) => renderStatRow(row, stats))}</tbody>
    </React.Fragment>
  );
}
