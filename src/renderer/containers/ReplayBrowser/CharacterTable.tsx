// import { GlobalStats, MatchupAggregate } from "common/game";
import { colors } from "@common/colors";
import { css } from "@emotion/react";
import type { GlobalStats } from "@replays/stats";
import _, { parseInt } from "lodash";
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { getCharacterIcon } from "@/lib/utils";

import * as T from "../ReplayFileStats/TableStyles";

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

  console.log(data);
  return (
    <>
      <ResponsiveContainer>
        <div
          css={css`
            display: flex;
            flex-direction: row;
            align-items: center;
          `}
        >
          {data.map((row) => (
            <div
              key="row,char"
              css={css`
                display: flex;
                align-items: center;
              `}
            >
              <PieChart
                css={css`
                  width: 130px;
                `}
                width={100}
                height={100}
              >
                <Pie
                  data={[
                    { char: row.char, count: row.wins },
                    { char: row.char, count: row.count - row.wins },
                  ]}
                  dataKey="count"
                  nameKey="char"
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={40}
                >
                  <Cell stroke={colors.offGray} fill={colors.greenDark} />
                  <Cell stroke={colors.offGray} fill={colors.offGray} />
                </Pie>
              </PieChart>
              <T.GrayableImage
                css={css`
                  width: 40px;
                  height: 40px;
                  position: relative;
                  top: 0;
                  left: -70px;
                `}
                src={getCharacterIcon(row.char, 0)}
                height={24}
                width={24}
              />
            </div>
          ))}
        </div>
      </ResponsiveContainer>
    </>
  );
};
