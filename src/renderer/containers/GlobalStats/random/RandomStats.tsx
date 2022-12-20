import { css } from "@mui/material";
import React from "react";
import { ResponsiveContainer } from "recharts";
import type { ProgressionStat } from "stats/progression";

import { StatSection } from "@/containers/ReplayFileStats/GameProfile";

interface RandomStatsProps {
  player: string;
  stats: ProgressionStat[];
}

export const RandomStats: React.FC<RandomStatsProps> = () => {
  return (
    <StatSection title="Progression" align="center">
      <ResponsiveContainer>
        <div
          css={css`
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            align-items: center;
            height: 1200px;
          `}
        ></div>
      </ResponsiveContainer>
    </StatSection>
  );
};
