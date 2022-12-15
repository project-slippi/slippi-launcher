// import { GlobalStats, MatchupAggregate } from "common/game";
import { colors } from "@common/colors";
import { css } from "@emotion/react";
import type { GlobalStats } from "@replays/stats";
import _, { parseInt } from "lodash";
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { getStageImage } from "@/lib/utils";

import * as T from "../ReplayFileStats/TableStyles";

const stagePiechart: React.FC<{ char: number; wins: number; total: number }> = ({ char, wins, total }) => (
  <div
    css={css`
      margin: auto;
    `}
  >
    <div
      key="row,char"
      css={css`
        width: 100px;
        display: flex;
        align-items: center;
      `}
    >
      <PieChart
        css={css`
          width: 100px;
        `}
        width={100}
        height={100}
      >
        <Pie
          data={[
            { char: char, count: wins },
            { char: char, count: total - wins },
          ]}
          dataKey="count"
          nameKey="char"
          cx="50%"
          cy="50%"
          innerRadius={30}
          outerRadius={40}
        >
          <Cell stroke="none" fill={colors.greenDark} />
          <Cell stroke="none" fill="red" />
        </Pie>
      </PieChart>
      <T.GrayableImage
        css={css`
          width: 40px;
          height: 40px;
          position: relative;
          top: -0px;
          left: -70px;
        `}
        src={getStageImage(char)}
        height={24}
        width={24}
      />
    </div>
    <div
      css={css`
        text-align: center;
      `}
    >
      {" "}
      {total}{" "}
    </div>
  </div>
);

export const StageTable: React.FC<{
  stats: GlobalStats;
}> = ({ stats }) => {
  const stageStats = stats.stages;
  const data = Object.keys(stageStats)
    .sort((a, b) => stageStats[b].count - stageStats[a].count)
    .slice(0, 26)
    .map((k) => {
      const op = stageStats[k];
      return {
        char: parseInt(k),
        count: op.count,
        wins: op.won,
      };
    });

  return (
    <ResponsiveContainer>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          flex-direction: row;
          align-items: center;
        `}
      >
        {data.map((row) => stagePiechart({ char: row.char, wins: row.wins, total: row.count }))}
      </div>
    </ResponsiveContainer>
  );
};
