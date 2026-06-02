import type { PlayerStatSummary, StatCell, StatRow, StatSection } from "../types";

function cell(value: string, highlight: boolean = false): StatCell {
  return { value, highlight };
}

function simpleStat(
  label: string,
  playerVal: number,
  oppVal: number,
  highlightFn: (a: number, b: number) => boolean,
  format: (v: number) => string = (v) => v.toFixed(1),
): StatRow {
  return {
    label,
    player: cell(format(playerVal), highlightFn(playerVal, oppVal)),
    opp: cell(format(oppVal), highlightFn(oppVal, playerVal)),
  };
}

function fractionStat(
  label: string,
  playerFraction: PlayerStatSummary["successfulConversions"],
  oppFraction: PlayerStatSummary["successfulConversions"],
  highlightFallback: "higher" | "lower",
): StatRow {
  const formatFraction = (f: { count: number; total: number; ratio: number }) => {
    const pct = (f.ratio * 100).toFixed(1);
    return `${pct}% (${f.count} / ${f.total})`;
  };
  const highlight = highlightFallback === "higher" ? (a: number, b: number) => a > b : (a: number, b: number) => a < b;
  return {
    label,
    player: cell(formatFraction(playerFraction), highlight(playerFraction.ratio, oppFraction.ratio)),
    opp: cell(formatFraction(oppFraction), highlight(oppFraction.ratio, playerFraction.ratio)),
  };
}

function countPercentStat(
  label: string,
  playerCount: number,
  oppCount: number,
  playerRatio: number | undefined,
  oppRatio: number | undefined,
  highlightFn: (a: number, b: number) => boolean,
): StatRow {
  const render = (count: number, ratio: number | undefined) => {
    const pct = ratio != null ? ` (${Math.round(ratio * 100)}%)` : "";
    return `${count}${pct}`;
  };
  return {
    label,
    player: cell(render(playerCount, playerRatio), highlightFn(playerCount, oppCount)),
    opp: cell(render(oppCount, oppRatio), highlightFn(oppCount, playerCount)),
  };
}

function multiStat(
  label: string,
  playerVals: number[],
  oppVals: number[],
  highlightFn?: (a: number[], b: number[]) => boolean,
): StatRow {
  return {
    label,
    player: cell(playerVals.join(" / "), highlightFn?.(playerVals, oppVals)),
    opp: cell(oppVals.join(" / "), highlightFn?.(oppVals, playerVals)),
  };
}

function lCancelStat(
  label: string,
  playerLCancel: { success: number; fail: number },
  oppLCancel: { success: number; fail: number },
): StatRow {
  const formatLCancel = (lc: { success: number; fail: number }) => {
    const total = lc.success + lc.fail;
    const rate = total === 0 ? 0 : (lc.success / total) * 100;
    return `${rate.toFixed(0)}% (${lc.success} / ${total})`;
  };
  const playerRate =
    playerLCancel.success + playerLCancel.fail === 0
      ? 0
      : playerLCancel.success / (playerLCancel.success + playerLCancel.fail);
  const oppRate =
    oppLCancel.success + oppLCancel.fail === 0 ? 0 : oppLCancel.success / (oppLCancel.success + oppLCancel.fail);
  return {
    label,
    player: cell(formatLCancel(playerLCancel), playerRate > oppRate),
    opp: cell(formatLCancel(oppLCancel), oppRate > playerRate),
  };
}

export function buildSections(p1: PlayerStatSummary, p2: PlayerStatSummary): StatSection[] {
  return [
    {
      title: "Offense",
      rows: [
        simpleStat("Kills", p1.kills, p2.kills, (a, b) => a > b, String),
        simpleStat("Damage Done", p1.totalDamage, p2.totalDamage, (a, b) => a > 0 && b > 0 && a > b),
        fractionStat("Opening Conversion Rate", p1.successfulConversions, p2.successfulConversions, "higher"),
        simpleStat("Openings / Kill", p1.openingsPerKill, p2.openingsPerKill, (a, b) => a < b),
        simpleStat("Damage / Opening", p1.damagePerOpening, p2.damagePerOpening, (a, b) => a > b),
      ],
    },
    {
      title: "Defense",
      rows: [
        multiStat(
          "Actions (Roll / Air Dodge / Spot Dodge)",
          [p1.rollCount, p1.airDodgeCount, p1.spotDodgeCount],
          [p2.rollCount, p2.airDodgeCount, p2.spotDodgeCount],
        ),
      ],
    },
    {
      title: "Neutral",
      rows: [
        countPercentStat(
          "Neutral Wins",
          p1.neutralWinRatio.count,
          p2.neutralWinRatio.count,
          p1.neutralWinRatio.ratio,
          p2.neutralWinRatio.ratio,
          (a, b) => a > b,
        ),
        countPercentStat(
          "Counter Hits",
          p1.counterHitRatio.count,
          p2.counterHitRatio.count,
          p1.counterHitRatio.ratio,
          p2.counterHitRatio.ratio,
          (a, b) => a > b,
        ),
        countPercentStat(
          "Beneficial Trades",
          p1.beneficialTradeRatio.count,
          p2.beneficialTradeRatio.count,
          p1.beneficialTradeRatio.ratio,
          p2.beneficialTradeRatio.ratio,
          (a, b) => a > b,
        ),
        multiStat(
          "Actions (Wavedash / Waveland / Dash Dance / Ledgegrab)",
          [p1.wavedashCount, p1.wavelandCount, p1.dashDanceCount, p1.ledgegrabCount],
          [p2.wavedashCount, p2.wavelandCount, p2.dashDanceCount, p2.ledgegrabCount],
        ),
      ],
    },
    {
      title: "General",
      rows: [
        simpleStat("Inputs / Minute", p1.inputsPerMinute, p2.inputsPerMinute, (a, b) => a > b),
        simpleStat("Digital Inputs / Minute", p1.digitalInputsPerMinute, p2.digitalInputsPerMinute, (a, b) => a > b),
        lCancelStat("L-Cancel Success Rate", p1.lCancelRate, p2.lCancelRate),
      ],
    },
  ];
}
