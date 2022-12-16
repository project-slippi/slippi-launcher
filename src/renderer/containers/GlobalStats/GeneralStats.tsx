import { css } from "@emotion/react";
import { Button } from "@mui/material";
import type { GlobalStats } from "@replays/stats";
import React from "react";

import { StatSection } from "../../containers/ReplayFileStats/GameProfile";
import { CharacterTable } from "./CharacterTable";
import { ComboTable } from "./ComboTable";
import { GlobalTable } from "./GlobalTable";
import { OpponentTable } from "./OpponentTable";
import { StageTable } from "./StageTable";

interface GemeralStatsProps {
  player: string;
  stats: GlobalStats;
}

export const GeneralStats: React.FC<GemeralStatsProps> = (props) => {
  return (
    <div style={{ flex: "1", margin: "auto", maxWidth: 1500 }}>
      <StatSection>
        <div
          css={css`
            display: flex;
            flex-direction: row;
            flex: 1;
            align-items: center;
          `}
        >
          <Button
            variant="contained"
            css={css`
              margin: auto;
            `}
          >
            {" "}
            General{" "}
          </Button>
          <Button
            css={css`
              margin: auto;
              border: 2px solid;
            `}
          >
            {" "}
            Progression{" "}
          </Button>
          <Button
            css={css`
              margin: auto;
              border: 2px solid;
            `}
          >
            {" "}
            Matchups{" "}
          </Button>
          <Button
            css={css`
              margin: auto;
              border: 2px solid;
            `}
          >
            {" "}
            Interactions{" "}
          </Button>
          <Button
            css={css`
              margin: auto;
              border: 2px solid;
            `}
          >
            {" "}
            Random{" "}
          </Button>
        </div>
      </StatSection>

      <StatSection>
        <StatSection>
          <StatSection title="Player Characters">
            <CharacterTable opponent={false} stats={props.stats} />
          </StatSection>
          <StatSection title="Opponent Characters">
            <CharacterTable opponent={true} stats={props.stats} />
          </StatSection>
        </StatSection>
        <StatSection title="Most Played Opponents">
          <OpponentTable stats={props.stats} />
        </StatSection>
      </StatSection>

      <StatSection title="Stages">
        <StageTable stats={props.stats} />
      </StatSection>

      <GlobalTable stats={props.stats} />

      <StatSection title="Top Conversions">
        <ComboTable player={props.player} stats={props.stats} />
      </StatSection>
    </div>
  );
};
