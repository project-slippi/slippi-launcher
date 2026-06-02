import ErrorIcon from "@mui/icons-material/Error";
import FolderIcon from "@mui/icons-material/Folder";
import HelpIcon from "@mui/icons-material/Help";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult } from "@replays/types";
import { GameMode } from "@slippi/slippi-js";
import { useQuery } from "@tanstack/react-query";

import { BasicFooter } from "@/components/footer/footer";
import { LoadingScreen } from "@/components/loading_screen/loading_screen";
import { IconMessage } from "@/components/message";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useMousetrap } from "@/lib/hooks/use_mousetrap";
import { getStageImage } from "@/lib/utils";
import { useServices } from "@/services";

import { GameProfile } from "./game_profile";
import { GameProfileHeader } from "./game_profile_header/game_profile_header";
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
  const error = gameStatsQuery.error as any;

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
  if (!props.file && error) {
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

  return (
    <div
      className={styles.outer}
      style={{ "--bg-image": stageImage ? `url("${stageImage}")` : "none" } as React.CSSProperties}
    >
      <GameProfileHeader
        {...props}
        file={file}
        disabled={loading}
        stats={gameStatsQuery.data?.stats}
        stadiumStats={stadiumStatsQuery.data?.stadiumStats}
        onPlay={props.onPlay}
      />
      <div className={styles.content}>
        {!file || loading ? (
          <LoadingScreen message={Messages.crunchingNumbers()} />
        ) : game.mode == GameMode.TARGET_TEST ? (
          <TargetTestProfile file={file} stats={stadiumStats} />
        ) : game.mode == GameMode.HOME_RUN_CONTEST ? (
          <HomeRunProfile file={file} stats={stadiumStats} />
        ) : numPlayers !== 2 ? (
          <IconMessage Icon={ErrorIcon} label={Messages.gameStatsForTeamBattlesIsUnsupported()} />
        ) : error ? (
          <IconMessage Icon={ErrorIcon} label={`Error: ${error.message ?? JSON.stringify(error, null, 2)}`} />
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
          <div className={styles.fileLabel} style={{ fontFamily: "Maven Pro, Helvetica, Arial, sans-serif" }}>
            {Messages.currentFile()}
          </div>
          <div className={styles.filePathText}>{filePath}</div>
        </div>
      </BasicFooter>
    </div>
  );
};
