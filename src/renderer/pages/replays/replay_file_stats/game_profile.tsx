import Typography from "@mui/material/Typography";
import type { FileResult } from "@replays/types";
import type { ActionCountsType, OverallType, RatioType, StatsType } from "@slippi/slippi-js";
import React from "react";

import { ErrorBoundary } from "@/components/error_boundary";
import { getCharacterIcon } from "@/lib/utils";

import styles from "./game_profile.module.css";
import { KillTable } from "./kill_table";
import { buildKillEvents } from "./kill_table/build_kill_events";
import { OverallTable } from "./overall_table";
import { buildSections } from "./overall_table/build_sections";
import { PunishTable } from "./punish_table";
import { buildTimeline } from "./punish_table/build_timeline";
import type { PlayerDisplayInfo, PlayerStatSummary } from "./types";

type GameProfileProps = {
  file: FileResult;
  stats: StatsType;
  onPlay: (options: { path: string; startFrame: number }) => void;
};

const StatSection = (props: React.PropsWithChildren<{ title: string }>) => (
  <div className={styles.section}>
    <Typography variant="h5" style={{ marginBottom: 10 }}>
      {props.title}
    </Typography>
    <div className={styles.tableContainer}>{props.children}</div>
  </div>
);

export const GameProfile = ({ file, stats, onPlay }: GameProfileProps) => {
  const [firstPlayer, secondPlayer] = file.game.players;

  const playerInfo: PlayerDisplayInfo[] = file.game.players.map((p) => ({
    characterIconUrl: getCharacterIcon(p.characterId, p.characterColor),
    name: p.displayName || p.tag || `Player ${p.playerIndex + 1}`,
  }));

  const playerStats: PlayerStatSummary[] = file.game.players.map((_p, i) =>
    buildPlayerStatSummary(stats.overall[i], stats.actionCounts[i]),
  );

  const sections = buildSections(playerStats[0], playerStats[1]);

  return (
    <div className={styles.root}>
      <StatSection title="Overall">
        <ErrorBoundary>
          <OverallTable players={[playerInfo[0], playerInfo[1]]} sections={sections} />
        </ErrorBoundary>
      </StatSection>
      <StatSection title="Kills">
        <KillTable
          player={playerInfo[0]}
          events={buildKillEvents(stats, secondPlayer.playerIndex)}
          filePath={file.fullPath}
          onPlay={onPlay}
        />
        <KillTable
          player={playerInfo[1]}
          events={buildKillEvents(stats, firstPlayer.playerIndex)}
          filePath={file.fullPath}
          onPlay={onPlay}
        />
      </StatSection>
      <StatSection title="Openings & Conversions">
        <PunishTable
          player={playerInfo[0]}
          timeline={buildTimeline(
            stats,
            firstPlayer.playerIndex,
            secondPlayer.playerIndex,
            playerInfo[1].characterIconUrl,
          )}
          filePath={file.fullPath}
          onPlay={onPlay}
        />
        <PunishTable
          player={playerInfo[1]}
          timeline={buildTimeline(
            stats,
            secondPlayer.playerIndex,
            firstPlayer.playerIndex,
            playerInfo[0].characterIconUrl,
          )}
          filePath={file.fullPath}
          onPlay={onPlay}
        />
      </StatSection>
    </div>
  );
};

function toRatioValue(r: RatioType): { count: number; total: number; ratio: number } {
  return { count: r.count, total: r.total, ratio: r.ratio ?? 0 };
}

function toCountRatio(r: RatioType): { count: number; ratio: number } {
  return { count: r.count, ratio: r.ratio ?? 0 };
}

function buildPlayerStatSummary(overall: OverallType, actionCounts: ActionCountsType): PlayerStatSummary {
  return {
    kills: overall.killCount,
    totalDamage: overall.totalDamage,
    successfulConversions: toRatioValue(overall.successfulConversions),
    openingsPerKill: overall.openingsPerKill.ratio ?? 0,
    damagePerOpening: overall.damagePerOpening.ratio ?? 0,
    rollCount: actionCounts.rollCount,
    airDodgeCount: actionCounts.airDodgeCount,
    spotDodgeCount: actionCounts.spotDodgeCount,
    neutralWinRatio: toCountRatio(overall.neutralWinRatio),
    counterHitRatio: toCountRatio(overall.counterHitRatio),
    beneficialTradeRatio: toCountRatio(overall.beneficialTradeRatio),
    wavedashCount: actionCounts.wavedashCount,
    wavelandCount: actionCounts.wavelandCount,
    dashDanceCount: actionCounts.dashDanceCount,
    ledgegrabCount: actionCounts.ledgegrabCount,
    inputsPerMinute: overall.inputsPerMinute.ratio ?? 0,
    digitalInputsPerMinute: overall.digitalInputsPerMinute.ratio ?? 0,
    lCancelRate: {
      rate:
        actionCounts.lCancelCount.fail + actionCounts.lCancelCount.success === 0
          ? 0
          : actionCounts.lCancelCount.success / (actionCounts.lCancelCount.success + actionCounts.lCancelCount.fail),
      success: actionCounts.lCancelCount.success,
      fail: actionCounts.lCancelCount.fail,
    },
  };
}
