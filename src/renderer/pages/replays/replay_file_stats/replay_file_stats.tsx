import ErrorIcon from "@mui/icons-material/Error";
import FolderIcon from "@mui/icons-material/Folder";
import HelpIcon from "@mui/icons-material/Help";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult } from "@replays/types";
import { frameToGameTimer, GameMode, stages as stageUtils } from "@slippi/slippi-js";
import { useQuery } from "@tanstack/react-query";
import React from "react";

import { BasicFooter } from "@/components/footer/footer";
import { LoadingScreen } from "@/components/loading_screen/loading_screen";
import { IconMessage } from "@/components/message";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useMousetrap } from "@/lib/hooks/use_mousetrap";
import { convertFrameCountToDurationString } from "@/lib/time";
import { getStageImage } from "@/lib/utils";
import { useServices } from "@/services";

import { GameProfile } from "./game_profile";
import { GameProfileHeader } from "./game_profile_header/game_profile_header";
import { GameProfileHeaderMessages as HeaderMessages } from "./game_profile_header/game_profile_header.messages";
import { HomeRunProfile } from "./home_run_profile";
import { ReplayFileStatsMessages as Messages } from "./replay_file_stats.messages";
import styles from "./replay_file_stats.module.css";
import { TargetTestProfile } from "./target_test_profile";

type ReplayFileStatsProps = {
  filePath: string;
  file?: FileResult;
  index?: number;
  total?: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onPlay: () => void;
};

export const ReplayFileStats = (props: ReplayFileStatsProps) => {
  const { filePath } = props;
  const { dolphinService, replayService } = useServices();
  const { viewReplays } = useDolphinActions(dolphinService);

  const gameStatsQuery = useQuery({
    queryKey: ["loadStatsQuery", filePath],
    queryFn: async () => {
      const result = await replayService.calculateGameStats(filePath);
      return result;
    },
  });

  const stadiumStatsQuery = useQuery({
    queryKey: ["loadStadiumStatsQuery", filePath],
    queryFn: async () => {
      const result = await replayService.calculateStadiumStats(filePath);
      return result;
    },
  });

  const loading = gameStatsQuery.isLoading && stadiumStatsQuery.isLoading;
  const errorMessage =
    gameStatsQuery.error instanceof Error
      ? gameStatsQuery.error.message
      : gameStatsQuery.error
      ? String(gameStatsQuery.error)
      : null;

  const file = gameStatsQuery.data?.file ?? props.file;
  const numPlayers = file?.game.players.length;
  const gameStats = gameStatsQuery.data?.stats;
  const stadiumStats = stadiumStatsQuery.data?.stadiumStats;

  // Add key bindings
  useMousetrap("escape", () => {
    if (!loading) {
      props.onClose();
    }
  });
  useMousetrap("left", () => {
    if (!loading) {
      props.onPrev();
    }
  });
  useMousetrap("right", () => {
    if (!loading) {
      props.onNext();
    }
  });

  const handleRevealLocation = () => window.electron.shell.showItemInFolder(filePath);

  // We only want to show this full-screen error if we don't have a
  // file in the prop. i.e. the SLP manually opened.
  if (!props.file && errorMessage) {
    return (
      <IconMessage Icon={ErrorIcon}>
        <div className={styles.errorContainer}>
          <h2>{Messages.weCouldntOpenThatFile()}</h2>
          <Button color="secondary" onClick={props.onClose}>
            {Messages.goBack()}
          </Button>
        </div>
      </IconMessage>
    );
  }

  if (!file) {
    return <LoadingScreen message={Messages.loading()} />;
  }

  const { game } = file;
  const stageImage = game.stageId != null ? getStageImage(game.stageId) : undefined;

  let stageName = HeaderMessages.unknown();
  try {
    stageName = stageUtils.getStageName(game.stageId != null ? game.stageId : 0);
  } catch (err) {
    console.error(err);
  }

  const platform = game.consoleNickname || game.platform || HeaderMessages.unknown();
  const startAtDisplay = new Date(game.startTime ? Date.parse(game.startTime) : 0);
  const lastFrame = game.lastFrame ?? gameStats?.lastFrame;
  // Sometimes metadata doesn't exist and won't have the last frame
  // but we might have the stats computed which contains the real last frame.
  // In that situation, we should use that lastFrame not the metadata one.
  const duration =
    lastFrame != null
      ? game.mode === GameMode.TARGET_TEST
        ? frameToGameTimer(lastFrame, {
            startingTimerSeconds: game.startingTimerSeconds,
            timerType: game.timerType,
          })
        : convertFrameCountToDurationString(lastFrame, "long")
      : HeaderMessages.unknown();

  const stadiumDistance = stadiumStats?.type === "home-run-contest" ? stadiumStats.distance : undefined;
  const stadiumUnits = stadiumStats?.type === "home-run-contest" ? stadiumStats.units : undefined;

  return (
    <div
      className={styles.outer}
      style={{ "--bg-image": stageImage ? `url("${stageImage}")` : "none" } as React.CSSProperties}
    >
      <GameProfileHeader
        players={file.game.players}
        isTeams={file.game.isTeams}
        index={props.index}
        total={props.total}
        gameDetails={{
          stageName,
          platform,
          startAtDisplay,
          duration,
          gameMode: game.mode ?? GameMode.VS,
          distance: stadiumDistance,
          units: stadiumUnits,
        }}
        onNext={props.onNext}
        onPrev={props.onPrev}
        onPlay={props.onPlay}
        onClose={props.onClose}
        disabled={loading}
      />
      <div className={styles.content}>
        {!file || loading ? (
          <LoadingScreen message={Messages.crunchingNumbers()} />
        ) : game.mode === GameMode.TARGET_TEST ? (
          <TargetTestProfile file={file} stats={stadiumStats} />
        ) : game.mode === GameMode.HOME_RUN_CONTEST ? (
          <HomeRunProfile file={file} stats={stadiumStats} />
        ) : numPlayers !== 2 ? (
          <IconMessage Icon={ErrorIcon} label={Messages.gameStatsForTeamBattlesIsUnsupported()} />
        ) : errorMessage ? (
          <IconMessage Icon={ErrorIcon} label={`Error: ${errorMessage}`} />
        ) : gameStats ? (
          <GameProfile file={file} stats={gameStats} onPlay={viewReplays} />
        ) : (
          <IconMessage Icon={HelpIcon} label={Messages.noStatsComputed()} />
        )}
      </div>
      <BasicFooter>
        <Tooltip title={Messages.revealLocation()}>
          <IconButton onClick={handleRevealLocation} size="small">
            <FolderIcon className={styles.folderIcon} />
          </IconButton>
        </Tooltip>
        <div className={styles.filePathContainer}>
          <div className={styles.fileLabel}>{Messages.currentFile()}</div>
          <div className={styles.filePathText}>{filePath}</div>
        </div>
      </BasicFooter>
    </div>
  );
};
