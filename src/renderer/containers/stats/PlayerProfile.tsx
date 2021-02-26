import { GlobalStats } from "common/game";
import React from "react";

import { StatSection } from "../ReplayFileStats/GameProfile";
import { CharacterTable } from "./CharacterTable";
import { ComboTable } from "./ComboTable";
import { GlobalTable } from "./GlobalTable";
import { OpponentTable } from "./OpponentTable";

interface PlayerProfileProps {
  stats: GlobalStats;
  player: string;
}
export const PlayerProfile: React.FC<PlayerProfileProps> = (props) => {
  const setOpponentFilter = (_: string[]) => {
    console.log();
  };

  return (
    <div style={{ flex: "1", margin: "auto", maxWidth: 1500 }}>
      <StatSection title="Characters">
        <CharacterTable opponent={false} stats={props.stats} />
        <OpponentTable stats={props.stats} setFiltered={setOpponentFilter} />
        <CharacterTable opponent={true} stats={props.stats} />
      </StatSection>
      <StatSection title="Global Stats">
        <GlobalTable stats={props.stats} />
      </StatSection>
      <StatSection title="Conversions">
        <ComboTable player={props.player} stats={props.stats} />
      </StatSection>
    </div>
  );
};
