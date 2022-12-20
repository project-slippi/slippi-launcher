import { css } from "@mui/material";
import React from "react";
import type { GlobalStats } from "stats/stats";

import { StatSection } from "@/containers/ReplayFileStats/GameProfile";

import { CharacterTable } from "./CharacterTable";
import { ComboTable } from "./ComboTable";
import { GlobalTable } from "./GlobalTable";
import { OpponentTable } from "./OpponentTable";
import { StageTable } from "./StageTable";

interface GeneralStatsProps {
  player: string;
  stats: GlobalStats;
}

export const GeneralStats: React.FC<GeneralStatsProps> = (props) => {
  return (
    <>
      <GlobalTable stats={props.stats} />

      <StatSection title="Player Characters">
        <CharacterTable opponent={false} stats={props.stats} />
      </StatSection>
      <StatSection title="Opponent Characters">
        <CharacterTable opponent={true} stats={props.stats} />
      </StatSection>

      <StatSection title="Stages">
        <StageTable stats={props.stats} />
      </StatSection>

      <StatSection title="Most Played Opponents">
        <OpponentTable stats={props.stats} />
      </StatSection>

      <StatSection title="Top Conversions">
        <ComboTable player={props.player} stats={props.stats} />
      </StatSection>
      <div
        css={css`
          min-height: 50px;
        `}
      />
    </>
  );
};
