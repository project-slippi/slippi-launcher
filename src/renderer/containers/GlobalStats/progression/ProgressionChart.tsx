import { css } from "@emotion/react";
import React from "react";
import { ResponsiveContainer } from "recharts";
import type { DailyStats } from "stats/progression";
import { compareDate } from "stats/stats";

import { ProgressionLineChart } from "./ProgressionLineChart";

export const ProgressionChart: React.FC<{
  stats: DailyStats | null;
}> = ({ stats }) => {
  const single = stats?.cummulative || [];
  const data = single
    .sort((a, b) => compareDate(b.day, a.day))
    .map((k) => ({
      day: k.day.toLocaleDateString(),
      count: k.count,
      won: k.wins,
      lost: k.count - k.wins,
    }));

  return (
    <ResponsiveContainer>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          flex-direction: row;
          align-items: center;
          height: 600px;
        `}
      >
        <ProgressionLineChart data={data} lines={["count", "won"]} />
      </div>
    </ResponsiveContainer>
  );
};
