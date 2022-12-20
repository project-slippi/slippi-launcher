import { colors } from "@common/colors";
import { css } from "@mui/material";
import React from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { GlobalStats } from "stats/stats";

import { StatSection } from "@/containers/ReplayFileStats/GameProfile";

import { ThrowsTable } from "./ThrowsTable";

interface AnalysisStatsProps {
  player: string;
  stats: GlobalStats;
}

export const AnalysisStats: React.FC<AnalysisStatsProps> = (props) => {
  const stats = props.stats;
  const techs = stats.actions.groundTechCount;
  const throws = stats.actions.throwCount;

  const techData = [
    { subject: "neutral", value: techs.neutral },
    { subject: "in", value: techs.in },
    { subject: "fail", value: techs.fail },
    { subject: "away", value: techs.away },
  ];

  const throwData = [
    { subject: "up", value: throws.up },
    { subject: "forward", value: throws.forward },
    { subject: "down", value: throws.down },
    { subject: "back", value: throws.back },
  ];

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
              align-items: top;
              height: 400px;
              margin: auto;
            `}
          >
            <RadarChart outerRadius={90} width={400} height={400} data={throwData} style={{ margin: "auto" }}>
              <PolarGrid />
              <PolarAngleAxis dy={5} dataKey="subject" />
              <Radar name="" dataKey="value" stroke={colors.greenDark} fill={colors.greenDark} fillOpacity={0.6} />
            </RadarChart>
            <ThrowsTable stats={stats} />
            <ThrowsTable stats={stats} />
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
              height: 400px;
              margin: auto;
            `}
          >
            <RadarChart outerRadius={90} width={400} height={400} data={techData} style={{ margin: "auto" }}>
              <PolarGrid />
              <PolarAngleAxis dy={5} dataKey="subject" />
              <Radar name="" dataKey="value" stroke={colors.greenDark} fill={colors.greenDark} fillOpacity={0.6} />
            </RadarChart>
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
