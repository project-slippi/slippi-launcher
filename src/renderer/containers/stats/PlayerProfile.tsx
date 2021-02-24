import { GlobalStats } from "common/game";
import React from "react";
import { StatSection } from "../ReplayFileStats/GameProfile";
import { CharacterTable } from "./CharacterTable";
import { ComboTable } from "./ComboTable";
import { GlobalTable } from "./GlobalTable";
import { OpponentTable } from "./OpponentTable";

export const PlayerProfile = () => {
  return (
    <div style={{ flex: "1", margin: 20 }}>
      <StatSection title="Global Stats">
        <GlobalTable stats={testStats} />
      </StatSection>
      <StatSection title="Characters">
        <CharacterTable stats={testStats} />
        <OpponentTable stats={testStats} />
        <CharacterTable stats={testStats} />
      </StatSection>
      <StatSection title="Conversions">
        <ComboTable stats={testStats} />
      </StatSection>
    </div>
  );
};

const testStats: GlobalStats = {
  player: "eastballz",
  count: 1,
  wins: 0,
  time: 0,
  kills: 0,
  deaths: 0,
  damageDone: 0,
  damageReceived: 0,
  conversionRate: 0,
  conversionRateCount: 0,
  conversionRateTotal: 0,
  openingsPerKill: 0,
  openingsPerKillCount: 0,
  openingsPerKillTotal: 0,
  damagePerOpening: 0,
  damagePerOpeningCount: 0,
  damagePerOpeningTotal: 0,
  neutralWinRatio: 0,
  neutralWinRatioCount: 0,
  neutralWinRatioTotal: 0,
  inputsPerMinute: 0,
  inputsPerMinuteCount: 0,
  inputsPerMinuteTotal: 0,
  digitalInputsPerMinute: 0,
  digitalInputsPerMinuteCount: 0,
  digitalInputsPerMinuteTotal: 0,
  charIds: {
    1: {
      count: 0,
      won: 0,
      unique: [],
      charIds: [],
    },
  },
  opponents: {
    alex: {
      count: 0,
      won: 0,
      unique: ["alex"],
      charIds: [2, 3],
    },
  },
  opponentChars: {
    1: {
      count: 0,
      won: 0,
      unique: [],
      charIds: [],
    },
  },
  punishes: [],
};
