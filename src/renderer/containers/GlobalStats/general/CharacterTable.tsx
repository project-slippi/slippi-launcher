import { colors } from "@common/colors";
import { css } from "@emotion/react";
import _, { parseInt } from "lodash";
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { GlobalStats } from "stats/stats";

import * as T from "@/containers/ReplayFileStats/TableStyles";
import { getCharacterIcon } from "@/lib/utils";

const characterPiechart: React.FC<{ char: number; wins: number; total: number }> = ({ char, wins, total }) => (
  <div css={css``}>
    <div
      key="row,char"
      css={css`
        width: 150px;
        display: flex;
        align-items: center;
      `}
    >
      <PieChart css={css``} width={150} height={150}>
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
          left: -95px;
        `}
        src={getCharacterIcon(char, 0)}
        height={24}
        width={24}
      />
    </div>
    <div
      css={css`
        text-align: center;
      `}
    >
      {total} G
    </div>
    <div
      css={css`
        text-align: center;
      `}
    >
      {wins} W / {total - wins} L
    </div>
  </div>
);

export const CharacterTable: React.FC<{
  opponent: boolean;
  stats: GlobalStats;
}> = ({ opponent, stats }) => {
  const charStats = opponent ? stats.opponentChars : stats.characters;
  const data = Object.keys(charStats)
    .sort((a, b) => charStats[b].count - charStats[a].count)
    .slice(0, 26)
    .map((k) => {
      const op = charStats[k];
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
        {data.map((row) => characterPiechart({ char: row.char, wins: row.wins, total: row.count }))}
      </div>
    </ResponsiveContainer>
  );
};
