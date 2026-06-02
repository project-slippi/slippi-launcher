export interface PlayerDisplayInfo {
  characterIconUrl: string;
  name: string;
}

export interface PlayerStatSummary {
  kills: number;
  totalDamage: number;
  successfulConversions: { count: number; total: number; ratio: number };
  openingsPerKill: number;
  damagePerOpening: number;
  rollCount: number;
  airDodgeCount: number;
  spotDodgeCount: number;
  neutralWinRatio: { count: number; ratio: number };
  counterHitRatio: { count: number; ratio: number };
  beneficialTradeRatio: { count: number; ratio: number };
  wavedashCount: number;
  wavelandCount: number;
  dashDanceCount: number;
  ledgegrabCount: number;
  inputsPerMinute: number;
  digitalInputsPerMinute: number;
  lCancelRate: { rate: number; success: number; fail: number };
}

export interface KillEvent {
  startFrame: number;
  endFrame: number | null;
  killMoveName: string | null;
  killDirection: "up" | "down" | "left" | "right" | null;
  percent: number;
}

export interface PunishEvent {
  startFrame: number;
  endFrame: number | null;
  damage: number;
  damageRange: string;
  movesCount: number;
  openingType: string;
}

export interface StockLossEvent {
  stockCount: number;
  totalStocks: number;
  characterIconUrl: string;
  hasPunishesBeforeDeath: boolean;
}

export type TimelineItem = { kind: "stock-loss"; stockLoss: StockLossEvent } | { kind: "punish"; punish: PunishEvent };

export interface StatCell {
  value: string;
  highlight: boolean;
}

export interface StatRow {
  label: string;
  player: StatCell;
  opp: StatCell;
}

export interface StatSection {
  title: string;
  rows: StatRow[];
}
