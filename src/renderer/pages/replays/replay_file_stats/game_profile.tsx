import Typography from "@mui/material/Typography";
import type { FileResult } from "@replays/types";
import type { StatsType } from "@slippi/slippi-js";
import React from "react";

import { ErrorBoundary } from "@/components/error_boundary";

import styles from "./game_profile.module.css";
import { KillTable } from "./kill_table";
import { OverallTable } from "./overall_table";
import { PunishTable } from "./punish_table";

type GameProfileProps = {
  file: FileResult;
  stats: StatsType;
  onPlay: (options: { path: string; startFrame: number }) => void;
};

const StatSection = (props: React.PropsWithChildren<{ title: string }>) => {
  return (
    <div className={styles.section}>
      <Typography variant="h5" style={{ marginBottom: 10 }}>
        {props.title}
      </Typography>
      <div className={styles.tableContainer}>{props.children}</div>
    </div>
  );
};

export const GameProfile = ({ file, stats, onPlay }: GameProfileProps) => {
  const [firstPlayer, secondPlayer] = file.game.players;

  return (
    <div className={styles.root}>
      <StatSection title="Overall">
        <ErrorBoundary>
          <OverallTable file={file} stats={stats} />
        </ErrorBoundary>
      </StatSection>
      <StatSection title="Kills">
        <KillTable file={file} stats={stats} player={firstPlayer} opp={secondPlayer} onPlay={onPlay} />
        <KillTable file={file} stats={stats} player={secondPlayer} opp={firstPlayer} onPlay={onPlay} />
      </StatSection>
      <StatSection title="Openings &amp; Conversions">
        <PunishTable file={file} stats={stats} player={firstPlayer} opp={secondPlayer} onPlay={onPlay} />
        <PunishTable file={file} stats={stats} player={secondPlayer} opp={firstPlayer} onPlay={onPlay} />
      </StatSection>
    </div>
  );
};
