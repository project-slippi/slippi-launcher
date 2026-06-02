import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EventIcon from "@mui/icons-material/Event";
import LandscapeIcon from "@mui/icons-material/Landscape";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SportsCricket from "@mui/icons-material/SportsCricket";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import Straighten from "@mui/icons-material/Straighten";
import TimerIcon from "@mui/icons-material/Timer";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult, PlayerInfo as PlayerInfoType } from "@replays/types";
import type { StadiumStatsType, StatsType } from "@slippi/slippi-js";
import { frameToGameTimer, GameMode, stages as stageUtils } from "@slippi/slippi-js";
import React from "react";

import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { convertFrameCountToDurationString, monthDayHourFormat } from "@/lib/time";

import styles from "../game_profile_header.module.css";
import { PlayerInfo } from "../player_info";
import { groupBy } from "../table_utils";
import { GameProfileHeaderMessages as Messages } from "./game_profile_header.messages";

type PlayerInfoDisplayProps = {
  isTeams?: boolean;
  players: PlayerInfoType[];
};

const PlayerInfoDisplay = ({ isTeams, players }: PlayerInfoDisplayProps) => {
  const teams = Object.values(groupBy(players, (p) => (isTeams ? p.teamId : p.port)));
  const elements: JSX.Element[] = [];
  teams.forEach((team, idx) => {
    const teamEls = team.map((player) => {
      return (
        <PlayerInfo
          key={`player-${player.playerIndex}`}
          isTeams={Boolean(isTeams)}
          playerIndex={player.playerIndex}
          type={player.type}
          teamId={player.teamId}
          characterId={player.characterId}
          characterColor={player.characterColor}
          connectCode={player.connectCode}
          displayName={player.displayName}
          tag={player.tag}
        />
      );
    });
    elements.push(
      <div key={`team-${idx}`} style={{ display: "flex" }}>
        {...teamEls}
      </div>,
    );

    // Add VS obj in between teams
    if (idx < teams.length - 1) {
      elements.push(
        <div key={`vs-${idx}`} className={styles.vsText}>
          vs
        </div>,
      );
    }
  });
  return <div style={{ marginTop: 10, display: "flex", alignItems: "center" }}>{...elements}</div>;
};

type GameProfileHeaderProps = {
  file: FileResult;
  index?: number;
  total?: number;
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onClose: () => void;
  disabled?: boolean;
  stats?: StatsType;
  stadiumStats?: StadiumStatsType;
};

export const GameProfileHeader = ({
  stats,
  stadiumStats,
  disabled,
  file,
  index,
  total,
  onNext,
  onPrev,
  onPlay,
  onClose,
}: GameProfileHeaderProps) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.headerTop}>
          <div>
            <Tooltip title={Messages.backToReplays()}>
              <span>
                <IconButton onClick={onClose} disabled={disabled} size="large" className={styles.backButton}>
                  <ArrowBackIcon />
                </IconButton>
              </span>
            </Tooltip>
          </div>
          <PlayerInfoDisplay players={file.game.players} isTeams={file.game.isTeams} />
        </div>
        <GameDetails file={file} stats={stats} stadiumStats={stadiumStats} />
      </div>
      <Controls disabled={disabled} index={index} total={total} onNext={onNext} onPrev={onPrev} onPlay={onPlay} />
    </div>
  );
};

const GameDetails = ({
  file,
  stats,
  stadiumStats,
}: {
  file: FileResult;
  stats?: Pick<StatsType, "lastFrame">;
  stadiumStats?: StadiumStatsType;
}) => {
  const { game } = file;
  let stageName = Messages.unknown();
  try {
    stageName = stageUtils.getStageName(game.stageId != null ? game.stageId : 0);
  } catch (err) {
    console.error(err);
  }

  const platform = game.consoleNickname || game.platform || Messages.unknown();

  const startAtDisplay = new Date(game.startTime ? Date.parse(game.startTime) : 0);

  // Sometimes metadata doesn't exist and won't have the last frame
  // but we might have the stats computed which contains the real last frame.
  // In that situation, we should use that lastFrame not the metadata one.
  const lastFrame = game.lastFrame ?? stats?.lastFrame;
  const durationLength =
    lastFrame != null
      ? game.mode === GameMode.TARGET_TEST
        ? frameToGameTimer(lastFrame, {
            startingTimerSeconds: game.startingTimerSeconds,
            timerType: game.timerType,
          })
        : convertFrameCountToDurationString(lastFrame, "long")
      : Messages.unknown();

  const distance = (stadiumStats as any)?.distance;
  const units = (stadiumStats as any)?.units;

  const eventDisplay = {
    label: <EventIcon />,
    content: monthDayHourFormat(startAtDisplay),
  };

  const timerDisplay = {
    label: <TimerIcon />,
    content: durationLength,
  };

  const stageDisplay = {
    label: <LandscapeIcon />,
    content: stageName,
  };

  const platformDisplay = {
    label: <SportsEsportsIcon />,
    content: platform,
  };

  const targetTestDisplay = {
    label: <TrackChangesIcon />,
    content: Messages.targetTest(),
  };

  const homerunDisplay = {
    label: <SportsCricket />,
    content: Messages.homeRunContest(),
  };

  const distanceDisplay = {
    label: <Straighten />,
    content: `${distance} ${units}`,
  };

  let displayData: { label: React.ReactNode; content: React.ReactNode }[];
  switch (game.mode) {
    case GameMode.HOME_RUN_CONTEST:
      displayData = [eventDisplay, distanceDisplay, homerunDisplay, platformDisplay];
      break;
    case GameMode.TARGET_TEST:
      displayData = [eventDisplay, timerDisplay, stageDisplay, targetTestDisplay, platformDisplay];
      break;
    case GameMode.ONLINE:
    case GameMode.VS:
    default:
      displayData = [eventDisplay, timerDisplay, stageDisplay, platformDisplay];
      break;
  }

  const metadataElements = displayData.map((details, i) => {
    return (
      <div key={`item-${i}-${details.content}`} className={styles.metadataItem}>
        <label className={styles.detailLabel}>{details.label}</label>
        <label className={styles.detailContent}>{details.content}</label>
      </div>
    );
  });

  return <div className={styles.metadataContainer}>{metadataElements}</div>;
};

const LaunchReplayButton = React.memo(({ onClick }: { onClick: () => void }) => {
  const playbackStatus = useDolphinStore((store) => store.playbackStatus);
  const title = playbackStatus === DolphinStatus.READY ? "" : Messages.dolphinIsUpdating();
  return (
    <Tooltip title={title}>
      <span>
        <Button
          variant="contained"
          onClick={onClick}
          color="primary"
          startIcon={<PlayArrowIcon />}
          disabled={playbackStatus !== DolphinStatus.READY}
        >
          {Messages.launchReplay()}
        </Button>
      </span>
    </Tooltip>
  );
});

const Controls = ({
  disabled,
  index,
  total,
  onPlay,
  onPrev,
  onNext,
}: {
  disabled?: boolean;
  index?: number;
  total?: number;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}) => {
  const indexLabel = index != null && total != null ? `${index + 1} / ${total}` : "1 / 1";
  const atStart = index == null || index === 0;
  const atEnd = total == null || index === total - 1;
  return (
    <div className={styles.controls}>
      <div>
        <LaunchReplayButton onClick={onPlay} />
      </div>
      <div className={styles.navContainer}>
        <Tooltip title={Messages.previousReplay()}>
          <span>
            <IconButton disabled={disabled || atStart} onClick={onPrev} size="small">
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <span>{indexLabel}</span>
        <Tooltip title={Messages.nextReplay()}>
          <span>
            <IconButton disabled={disabled || atEnd} onClick={onNext} size="small">
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};
