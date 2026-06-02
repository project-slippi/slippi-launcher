export type HighlightFn = (a: number, b: number) => boolean;

export type MultiRow = {
  kind: "multi";
  label: string;
  path: string;
  fields?: string[];
  highlight?: (values: unknown[], oppValues: unknown[]) => boolean;
  valueMapper?: (v: unknown) => string;
  subKey?: string;
};

export type SimpleRatioRow = {
  kind: "simple-ratio";
  label: string;
  path: string;
  field: string;
  highlight: "higher" | "lower" | HighlightFn;
};

export type PercentFractionRow = {
  kind: "percent-fraction";
  label: string;
  path: string;
  field: string;
  highlight: "higher" | "lower" | HighlightFn;
};

export type CountPercentRow = {
  kind: "count-percent";
  label: string;
  path: string;
  field: string;
  highlight?: HighlightFn;
};

export type StatRow = MultiRow | SimpleRatioRow | PercentFractionRow | CountPercentRow;

export type Section = {
  title: string;
  rows: StatRow[];
};

export const statSections: Section[] = [
  {
    title: "Offense",
    rows: [
      {
        kind: "multi",
        label: "Kills",
        path: "overall",
        fields: ["killCount"],
        highlight: (v, ov) => (v[0] as number) > (ov[0] as number),
      },
      {
        kind: "multi",
        label: "Damage Done",
        path: "overall",
        fields: ["totalDamage"],
        highlight: (v, ov) => {
          const a = Number(v[0]);
          const b = Number(ov[0]);
          return a > 0 && b > 0 && a > b;
        },
        valueMapper: (v) => (v as number).toFixed(1),
      },
      {
        kind: "percent-fraction",
        label: "Opening Conversion Rate",
        path: "overall",
        field: "successfulConversions",
        highlight: "higher",
      },
      {
        kind: "simple-ratio",
        label: "Openings / Kill",
        path: "overall",
        field: "openingsPerKill",
        highlight: "lower",
      },
      {
        kind: "simple-ratio",
        label: "Damage / Opening",
        path: "overall",
        field: "damagePerOpening",
        highlight: "higher",
      },
    ],
  },
  {
    title: "Defense",
    rows: [
      {
        kind: "multi",
        label: "Actions (Roll / Air Dodge / Spot Dodge)",
        path: "actionCounts",
        fields: ["rollCount", "airDodgeCount", "spotDodgeCount"],
      },
    ],
  },
  {
    title: "Neutral",
    rows: [
      {
        kind: "count-percent",
        label: "Neutral Wins",
        path: "overall",
        field: "neutralWinRatio",
        highlight: (playerCount, oppCount) => playerCount > oppCount,
      },
      {
        kind: "count-percent",
        label: "Counter Hits",
        path: "overall",
        field: "counterHitRatio",
        highlight: (playerCount, oppCount) => playerCount > oppCount,
      },
      {
        kind: "count-percent",
        label: "Beneficial Trades",
        path: "overall",
        field: "beneficialTradeRatio",
        highlight: (playerCount, oppCount) => playerCount > oppCount,
      },
      {
        kind: "multi",
        label: "Actions (Wavedash / Waveland / Dash Dance / Ledgegrab)",
        path: "actionCounts",
        fields: ["wavedashCount", "wavelandCount", "dashDanceCount", "ledgegrabCount"],
      },
    ],
  },
  {
    title: "General",
    rows: [
      {
        kind: "simple-ratio",
        label: "Inputs / Minute",
        path: "overall",
        field: "inputsPerMinute",
        highlight: "higher",
      },
      {
        kind: "simple-ratio",
        label: "Digital Inputs / Minute",
        path: "overall",
        field: "digitalInputsPerMinute",
        highlight: "higher",
      },
      {
        kind: "multi",
        label: "L-Cancel Success Rate",
        path: "actionCounts",
        valueMapper: (val: any) => {
          if (!val) {
            return "N/A";
          }
          const { fail, success } = val;
          const total = success + fail;
          const rate = total === 0 ? 0 : (success / (success + fail)) * 100;
          return `${rate.toFixed(0)}% (${success} / ${total})`;
        },
        subKey: "lCancelCount",
      },
    ],
  },
];
