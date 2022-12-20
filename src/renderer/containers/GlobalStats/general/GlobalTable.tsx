import { css } from "@mui/material";
import React from "react";
import type { GlobalStats, Ratio } from "stats/stats";

import { StatSection } from "@/containers/ReplayFileStats/GameProfile";

export function toOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatPercent(n: number, fractionalDigits: number | 2) {
  return `${(n * 100).toFixed(fractionalDigits)}%`;
}

export interface GlobalTableProps {
  stats: GlobalStats;
}

const H1: React.FC<{ content: any }> = ({ content }) => (
  <div
    css={css`
      font-size: 30px;
      text-align: center;
      font-weight: bold;
    `}
  >
    {content}
  </div>
);

const H2: React.FC<{ content: any }> = ({ content }) => (
  <div
    css={css`
      font-size: 30px;
      text-align: center;
    `}
  >
    {content}
  </div>
);

const S1: React.FC<{ content: any }> = ({ content }) => (
  <div
    css={css`
      font-size: 20px;
      text-align: center;
    `}
  >
    {content}
  </div>
);

const showRatioBasic = (ratio: Ratio, decimals: number) => (ratio.count / ratio.total).toFixed(decimals);
const showRatio = (ratio: Ratio, decimals: number) => ((ratio.count / ratio.total) * 100).toFixed(decimals) + "%";
const showTime = (time: number) => (time / 216000).toFixed(0);

export const GlobalTable: React.FC<GlobalTableProps> = ({ stats }) => {
  return (
    <div
      css={css`
        padding-top: 80px;
        padding-bottom: 80px;
      `}
    >
      <StatSection>
        <div>
          <H1 content={stats.count} />
          <H2 content="GAMES" />
          <S1 content={`${stats.wins}W ${stats.count - stats.wins}L`} />
        </div>
        <div>
          <H1 content={showTime(stats.time)} />
          <H2 content="HOURS PLAYED" />
        </div>
        <div>
          <H1 content={Object.keys(stats.opponents).length} />
          <H2 content="OPPONENTS FOUGHT" />
        </div>
      </StatSection>

      <StatSection>
        <div>
          <H1 content={stats.kills} />
          <H2 content="KILLS" />
          <S1 content={stats.deaths + " Deaths"} />
        </div>
        <div>
          <H1 content={parseInt(stats.damageDone.toFixed(0)).toLocaleString() + "%"} />
          <H2 content="DAMAGE DEALT" />
          <S1 content={parseInt(stats.damageDone.toFixed(0)).toLocaleString() + "% Received"} />
        </div>
        <div>
          <H1 content={showRatioBasic(stats.inputsPerMinute, 0)} />
          <H2 content="INPUTS / MIN" />
          <S1 content={showRatioBasic(stats.digitalInputsPerMinute, 0) + " digital"} />
        </div>
      </StatSection>

      <StatSection>
        <div>
          <H1 content={showRatio(stats.conversionRate, 2)} />
          <H2 content="CONVERSION RATE" />
        </div>
        <div>
          <H1 content={showRatioBasic(stats.openingsPerKill, 2)} />
          <H2 content="OPENINGS / KILL" />
        </div>
        <div>
          <H1 content={showRatioBasic(stats.damagePerOpening, 2) + "%"} />
          <H2 content="DAMAGE / OPENING" />
        </div>
      </StatSection>

      <StatSection>
        <div>
          <H1 content={showRatio(stats.neutralWinrate, 2)} />
          <H2 content="NEUTRAL WINRATE" />
        </div>
        <div>
          <H1 content={showRatio(stats.counterhitWinrate, 2)} />
          <H2 content="COUNTER HITS" />
        </div>
        <div>
          <H1 content={showRatio(stats.tradeWinrate, 2)} />
          <H2 content="BENEFICIAL TRADES" />
        </div>
      </StatSection>
    </div>
  );
};
