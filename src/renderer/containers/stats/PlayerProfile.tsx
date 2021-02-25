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
  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Global Stats">
        <GlobalTable stats={props.stats} />
      </StatSection>
      <StatSection title="Characters">
        <CharacterTable stats={props.stats} />
        <OpponentTable stats={props.stats} />
        <CharacterTable stats={props.stats} />
      </StatSection>
      <StatSection title="Conversions">
        <ComboTable player={props.player} stats={props.stats} />
      </StatSection>
    </div>
  );
};
