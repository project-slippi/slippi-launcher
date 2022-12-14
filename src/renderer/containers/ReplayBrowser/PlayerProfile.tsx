import type { GameFilters, GlobalStats } from "@replays/stats";
import React from "react";

import { StatSection } from "../../containers/ReplayFileStats/GameProfile";
import { CharacterTable } from "./CharacterTable";
import { ComboTable } from "./ComboTable";
import { GlobalTable } from "./GlobalTable";
import { OpponentTable } from "./OpponentTable";

interface PlayerProfileProps {
  stats: GlobalStats;
  player: string;
  filters: GameFilters;
  // queryFilters: (filters: GameFilters) => void;
}
export const PlayerProfile: React.FC<PlayerProfileProps> = (props) => {
  return (
    <div style={{ flex: "1", margin: "auto", maxWidth: 1500 }}>
      <StatSection title="Characters Played">
        <CharacterTable opponent={false} stats={props.stats} />
      </StatSection>
      <StatSection title="Matchups">
        <CharacterTable opponent={true} stats={props.stats} />
      </StatSection>
      <StatSection title="Global Stats">
        <GlobalTable stats={props.stats} />
      </StatSection>
      <StatSection title="Top Opponents">
        <OpponentTable stats={props.stats} />
      </StatSection>
      <StatSection title="Conversions">
        <ComboTable player={props.player} stats={props.stats} />
      </StatSection>
    </div>
  );
};
