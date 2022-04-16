import { css } from "@emotion/react";
import styled from "@emotion/styled";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EventIcon from "@mui/icons-material/Event";
import LandscapeIcon from "@mui/icons-material/Landscape";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { FileResult } from "@replays/types";
import type { GameStartType, MetadataType, StatsType } from "@slippi/slippi-js";
import { stages as stageUtils } from "@slippi/slippi-js";
import _ from "lodash";
import moment from "moment";
import React from "react";

import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/useDolphinStore";
import { extractPlayerNames } from "@/lib/matchNames";
import { convertFrameCountToDurationString, monthDayHourFormat } from "@/lib/time";

import { PlayerInfo } from "./PlayerInfo";

const Outer = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
`;

interface PlayerInfoDisplayProps {
  settings: GameStartType;
  metadata: MetadataType | null;
}

const PlayerInfoDisplay: React.FC<PlayerInfoDisplayProps> = ({ settings, metadata }) => {
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();

  const elements: JSX.Element[] = [];
  teams.forEach((team, idx) => {
    const teamEls = team.map((player) => {
      const names = extractPlayerNames(player.playerIndex, settings, metadata);
      return (
        <PlayerInfo
          key={`player-${player.playerIndex}`}
          player={player}
          isTeams={Boolean(settings.isTeams)}
          names={names}
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

export interface GameProfileHeaderProps {
  file: FileResult;
  index: number | null;
  total: number | null;
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onClose: () => void;
  disabled?: boolean;
  stats: StatsType | null;
}

export const GameProfileHeader: React.FC<GameProfileHeaderProps> = ({
  stats,
  disabled,
  file,
  index,
  total,
  onNext,
  onPrev,
  onPlay,
  onClose,
}) => {
  const { metadata, settings } = file;
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
          <PlayerInfoDisplay metadata={metadata} settings={settings} />
        </div>
        <GameDetails file={file} stats={stats} />
      </div>
      <Controls disabled={disabled} index={index} total={total} onNext={onNext} onPrev={onPrev} onPlay={onPlay} />
    </div>
  );
};

const GameDetails: React.FC<{
  file: FileResult;
  stats: StatsType | null;
}> = ({ file, stats }) => {
  let stageName = "Unknown";
  try {
    stageName = stageUtils.getStageName(file.settings.stageId !== null ? file.settings.stageId : 0);
  } catch (err) {
    console.error(err);
  }

  let platform = _.get(file.metadata, "playedOn") || "Unknown";
  const consoleNick = _.get(file.metadata, "consoleNick");
  if (consoleNick !== "unknown") {
    platform = consoleNick || platform;
  }

  const startAtDisplay = new Date(file.startTime ? Date.parse(file.startTime) : 0);

  // Sometimes metadata doesn't exist and won't have the last frame
  // but we might have the stats computed which contains the real last frame.
  // In that situation, we should use that lastFrame not the metadata one.
  let duration = _.get(file.metadata, "lastFrame");
  if (duration === null || duration === undefined) {
    duration = _.get(stats, "lastFrame");
  }
  const durationLength =
    duration !== null && duration !== undefined ? convertFrameCountToDurationString(duration, "m[m] ss[s]") : "Unknown";

  const displayData = [
    {
      label: <EventIcon />,
      content: monthDayHourFormat(moment(startAtDisplay)) as string,
    },
    {
      label: <TimerOutlinedIcon />,
      content: durationLength,
    },
    {
      label: <LandscapeIcon />,
      content: stageName,
    },
    {
      label: <SportsEsportsIcon />,
      content: platform,
    },
  ];

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

const Controls: React.FC<{
  disabled?: boolean;
  index: number | null;
  total: number | null;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ disabled, index, total, onPlay, onPrev, onNext }) => {
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
