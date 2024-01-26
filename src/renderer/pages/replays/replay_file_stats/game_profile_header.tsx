import { css } from "@emotion/react";
import styled from "@emotion/styled";
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
import get from "lodash/get";
import groupBy from "lodash/groupBy";
import React from "react";

import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/use_dolphin_store";
import { convertFrameCountToDurationString, monthDayHourFormat } from "@/lib/time";

import { PlayerInfo } from "./player_info";

const Outer = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
`;

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
          type={player.type ?? undefined}
          teamId={player.teamId ?? undefined}
          characterId={player.characterId ?? undefined}
          characterColor={player.characterColor ?? undefined}
          connectCode={player.connectCode ?? undefined}
          displayName={player.displayName ?? undefined}
          tag={player.tag ?? undefined}
        />
      );
    });
    elements.push(
      <div
        key={`team-${idx}`}
        css={css`
          display: flex;
        `}
      >
        {...teamEls}
      </div>,
    );

    // Add VS obj in between teams
    if (idx < teams.length - 1) {
      // If this is not the last team, add a "vs" element
      elements.push(
        <div
          key={`vs-${idx}`}
          css={css`
            font-weight: bold;
            color: rgba(255, 255, 255, 0.5);
            padding: 0 10px;
            font-size: 20px;
          `}
        >
          vs
        </div>,
      );
    }
  });
  return <Outer>{...elements}</Outer>;
};

type GameProfileHeaderProps = {
  file: FileResult;
  index: number | null;
  total: number | null;
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onClose: () => void;
  disabled?: boolean;
  stats: StatsType | null;
  stadiumStats: StadiumStatsType | null;
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
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: solid 3px rgba(255, 255, 255, 0.5);
      `}
    >
      <div
        css={css`
          display: flex;
          flex-direction: column;
        `}
      >
        <div
          css={css`
            display: flex;
            align-items: center;
          `}
        >
          <div>
            <Tooltip title="Back to replays">
              <span>
                <IconButton
                  onClick={onClose}
                  disabled={disabled}
                  css={css`
                    padding: 8px;
                  `}
                  size="large"
                >
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
  stats: Pick<StatsType, "lastFrame"> | null;
  stadiumStats: StadiumStatsType | null;
}) => {
  const { game } = file;
  let stageName = "Unknown";
  try {
    stageName = stageUtils.getStageName(game.stageId != null ? game.stageId : 0);
  } catch (err) {
    console.error(err);
  }

  const platform = game.consoleNickname || game.platform || "Unknown";

  const startAtDisplay = new Date(game.startTime ? Date.parse(game.startTime) : 0);

  // Sometimes metadata doesn't exist and won't have the last frame
  // but we might have the stats computed which contains the real last frame.
  // In that situation, we should use that lastFrame not the metadata one.
  const lastFrame = game.lastFrame ?? stats?.lastFrame;
  const durationLength =
    lastFrame != null
      ? game.mode === GameMode.TARGET_TEST
        ? frameToGameTimer(lastFrame, {
            startingTimerSeconds: game.startingTimerSeconds ?? null,
            timerType: game.timerType ?? null,
          })
        : convertFrameCountToDurationString(lastFrame, "m[m] ss[s]")
      : "Unknown";

  const distance = get(stadiumStats, "distance");
  const units = get(stadiumStats, "units");

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
    content: "Break the Targets",
  };

  const homerunDisplay = {
    label: <SportsCricket />,
    content: "Home Run Contest",
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
      <div
        key={`item-${i}-${details.content}`}
        css={css`
          margin: 10px;
          display: flex;
          align-items: center;
          font-size: 14px;
        `}
      >
        <DetailLabel>{details.label}</DetailLabel>
        <DetailContent>{details.content}</DetailContent>
      </div>
    );
  });

  return (
    <div
      css={css`
        display: flex;
        padding: 0 10px;
      `}
    >
      {metadataElements}
    </div>
  );
};

const LaunchReplayButton = React.memo(({ onClick }: { onClick: () => void }) => {
  const playbackStatus = useDolphinStore((store) => store.playbackStatus);
  const title = playbackStatus === DolphinStatus.READY ? "" : "Dolphin is updating";
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
          Launch Replay
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
  index: number | null;
  total: number | null;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}) => {
  const indexLabel = index !== null && total !== null ? `${index + 1} / ${total}` : "1 / 1";
  const atStart = index === null || index === 0;
  const atEnd = total === null || index === total - 1;
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        margin: 10px;
      `}
    >
      <div>
        <LaunchReplayButton onClick={onPlay} />
      </div>
      <div
        css={css`
          margin-top: 10px;
          display: grid;
          grid-auto-flow: column;
          align-items: center;
          justify-content: center;
          grid-gap: 10px;
          font-size: 13px;
        `}
      >
        <Tooltip title="Previous replay">
          <span>
            <IconButton disabled={disabled || atStart} onClick={onPrev} size="small">
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <span>{indexLabel}</span>
        <Tooltip title="Next replay">
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

const DetailLabel = styled.label`
  display: flex;
  align-items: center;
  font-weight: bold;
  opacity: 0.6;
  margin-right: 5px;
  svg {
    font-size: 22px;
  }
`;

// `text-transform: capitalize` doesn't work unless it's an inline-block
// See: https://stackoverflow.com/a/49783868 for more info
const DetailContent = styled.label`
  text-transform: capitalize;
  display: inline-block;
`;
