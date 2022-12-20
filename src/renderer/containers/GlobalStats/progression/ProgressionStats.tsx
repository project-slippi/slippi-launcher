import { css } from "@mui/material";
import React from "react";
import { ResponsiveContainer } from "recharts";
import type { ProgressionStat } from "stats/progression";
import { compareDate } from "stats/stats";

import { StatSection } from "@/containers/ReplayFileStats/GameProfile";

import { ProgressionAreaChart } from "./ProgressionAreaChart";
import { ProgressionLineChart } from "./ProgressionLineChart";

interface ProgressionStatsProps {
  player: string;
  stats: ProgressionStat[];
}

export const ProgressionStats: React.FC<ProgressionStatsProps> = (props) => {
  const singleData = props.stats
    .sort((a, b) => compareDate(b.day, a.day))
    .map((stats) => {
      const techs = stats.actions.groundTechCount;
      const successfulTechs = techs.in + techs.away + techs.neutral;
      const techRatio = (successfulTechs / (successfulTechs + techs.fail)) * 100;
      const grabs = stats.actions.grabCount;
      const throws = stats.actions.throwCount;
      const grabRatio = (grabs.success / (grabs.success + grabs.fail)) * 100 || 0;
      const attacks = stats.actions.attackCount;

      return {
        day: stats.day.toLocaleDateString(),
        count: stats.count,
        won: stats.wins,
        lost: stats.count - stats.wins,
        lcancelRate:
          (stats.actions.lCancelCount.success /
            (stats.actions.lCancelCount.success + stats.actions.lCancelCount.fail)) *
          100,
        ipm: stats.inputsPerMinute.ratio,
        dipm: stats.digitalInputsPerMinute.ratio,
        techRatio,
        grabRatio,
        wavedashRate: stats.actions.wavedashCount / stats.count,
        wavelandRate: stats.actions.wavelandCount / stats.count,
        airDodgeRate: stats.actions.airDodgeCount / stats.count,
        dashDanceRate: stats.actions.dashDanceCount / stats.count,
        spotDodgeRate: stats.actions.spotDodgeCount / stats.count,
        ledgegrabRate: stats.actions.ledgegrabCount / stats.count,
        rollRate: stats.actions.rollCount / stats.count,
        jabRate: (attacks.jab1 + attacks.jab2 + attacks.jab3) / stats.count,
        tiltRate: (attacks.dtilt + attacks.utilt + attacks.ftilt) / stats.count,
        smashRate: (attacks.dsmash + attacks.usmash + attacks.fsmash) / stats.count,
        aerialRate: (attacks.nair + attacks.uair + attacks.fair + attacks.bair + attacks.dair) / stats.count,
        throwRate: (throws.up + throws.forward + throws.down + throws.back) / stats.count,
        damagePerOpening: stats.damagePerOpening.ratio,
        counterhitWinrate: stats.counterhitWinrate.ratio * 100,
        neutralWinrate: stats.neutralWinrate.ratio * 100,
        conversionRate: stats.conversionRate.ratio * 100,
        tradeWinrate: stats.tradeWinrate.ratio * 100 || 0,
        uairRate: attacks.uair / stats.count,
        fairRate: attacks.fair / stats.count,
        bairRate: attacks.bair / stats.count,
        dairRate: attacks.dair / stats.count,
        nairRate: attacks.nair / stats.count,
        usmashRate: attacks.usmash / stats.count,
        dsmashRate: attacks.dsmash / stats.count,
        fsmashRate: attacks.fsmash / stats.count,
        dtiltRate: attacks.dtilt / stats.count,
        utiltRate: attacks.utilt / stats.count,
        ftiltRate: attacks.ftilt / stats.count,
        upthrowRate: throws.up / stats.count,
        forwardthrowRate: throws.forward / stats.count,
        downthrowRate: throws.down / stats.count,
        backthrowRate: throws.back / stats.count,
        techInRate: techs.in / stats.count,
        techAwayRate: techs.away / stats.count,
        techNeutralRate: techs.neutral / stats.count,
        techFailRate: techs.fail / stats.count,
      };
    });

  const cummulative = props.stats;
  const cummulativeData = cummulative
    .sort((a, b) => compareDate(b.day, a.day))
    .map((stats) => {
      const opCharsTotal = Object.keys(stats.opponentChars)
        .map((c) => stats.opponentChars[c].count)
        .reduce((a, b) => a + b, 0);
      const opChars = { day: stats.day.toLocaleDateString() };
      const sortedChars = Object.keys(stats.opponentChars).sort();
      for (const c of sortedChars) {
        opChars[c] = (stats.opponentChars[c].count / opCharsTotal) * 100;
      }

      return {
        day: stats.day.toLocaleDateString(),
        count: stats.count,
        won: stats.wins,
        lost: stats.count - stats.wins,
        totalOpponents: Object.keys(stats.opponents).length,
        opChars,
      };
    });

  cummulativeData.sort((a, b) => compareDate(new Date(b.day), new Date(a.day)));

  const totals = {};
  for (let i = 1; i < cummulativeData.length; i++) {
    const prev = cummulativeData[i - 1];
    const curr = cummulativeData[i];
    curr.count += prev.count;
    curr.won += prev.won;
    curr.lost += prev.lost;
    curr.totalOpponents += prev.totalOpponents;
    console.log(curr.day);
    for (const c of Object.keys(curr.opChars)) {
      if (c == "day") {
        continue;
      }
      curr.opChars[c] += prev.opChars[c] || 0;
      totals[c] += prev.opChars[c] || 0;
    }
  }
  const opChars = cummulativeData.map((s) => s.opChars);

  // TODO
  // stack area chart for techs / aerials / throws

  return (
    <>
      <StatSection title="Progression" align="center">
        <ResponsiveContainer>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              align-items: center;
            `}
          >
            <ProgressionAreaChart data={cummulativeData} areas={["won", "lost"]} />
            <ProgressionAreaChart data={cummulativeData} areas={["totalOpponents"]} />
            <ProgressionAreaChart unstack={true} data={singleData} areas={["ipm", "dipm"]} />
          </div>
        </ResponsiveContainer>
      </StatSection>

      <StatSection title="Progression" align="center">
        <ResponsiveContainer>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              align-items: center;
            `}
          >
            <ProgressionLineChart
              data={singleData}
              lines={["counterhitWinrate", "neutralWinrate", "conversionRate", "tradeWinrate"]}
            />
            <ProgressionLineChart data={singleData} lines={["damagePerOpening"]} />
            <ProgressionLineChart data={singleData} lines={["lcancelRate", "techRatio", "grabRatio"]} />
          </div>
        </ResponsiveContainer>
      </StatSection>

      <StatSection title="Progression" align="center">
        <ResponsiveContainer>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              align-items: center;
            `}
          >
            <ProgressionAreaChart data={singleData} areas={["jabRate", "tiltRate", "smashRate", "throwRate"]} />
            <ProgressionAreaChart
              data={singleData}
              areas={["nairRate", "uairRate", "fairRate", "bairRate", "dairRate"]}
            />
          </div>
        </ResponsiveContainer>
      </StatSection>

      <StatSection title="" align="center">
        <ResponsiveContainer>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              align-items: center;
            `}
          >
            <ProgressionAreaChart data={singleData} areas={["usmashRate", "dsmashRate", "fsmashRate"]} />
            <ProgressionAreaChart data={singleData} areas={["utiltRate", "dtiltRate", "ftiltRate"]} />
            <ProgressionAreaChart
              data={singleData}
              areas={["upthrowRate", "forwardthrowRate", "downthrowRate", "backthrowRate"]}
            />
          </div>
        </ResponsiveContainer>
      </StatSection>

      <StatSection title="" align="center">
        <ResponsiveContainer>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              align-items: center;
            `}
          >
            <ProgressionAreaChart data={singleData} areas={["dashDanceRate", "wavedashRate", "wavelandRate"]} />
            <ProgressionAreaChart data={singleData} areas={["airDodgeRate", "spotDodgeRate", "rollRate"]} />
            <ProgressionAreaChart
              data={singleData}
              areas={["techFailRate", "techNeutralRate", "techInRate", "techAwayRate"]}
            />
          </div>
        </ResponsiveContainer>
      </StatSection>

      <StatSection title="" align="center">
        <ResponsiveContainer>
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              flex-direction: row;
              align-items: center;
            `}
          >
            <ProgressionAreaChart
              size={{ width: 1000, height: 500 }}
              data={cummulativeData.map((s) => s.opChars)}
              areas={Object.keys(opChars).sort((a, b) => opChars[b] - opChars[a])}
            />
          </div>
        </ResponsiveContainer>
      </StatSection>

      <div
        css={css`
          min-height: 50px;
        `}
      />
    </>
  );
};
