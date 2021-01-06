import _ from "lodash";
import { useReplays } from "@/store/replays";
import { FileResult } from "common/replayBrowser";
import React from "react";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import HelpIcon from "@material-ui/icons/Help";
import ErrorIcon from "@material-ui/icons/Error";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { GameProfile } from "./GameProfile";
import { LoadingScreen } from "@/components/LoadingScreen";
import styled from "styled-components";
import { GameProfileHeader } from "./GameProfileHeader";
import { stages as stageUtils, StatsType } from "@slippi/slippi-js";
import {
  convertFrameCountToDurationString,
  monthDayHourFormat,
} from "../../../common/time";
import moment from "moment";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import { getStageImage } from "@/lib/utils";
import { colors } from "common/colors";
import { IconMessage } from "@/components/Message";

const Outer = styled.div<{
  backgroundImage?: any;
}>`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export interface ReplayFileStatsProps {
  file: FileResult;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const ReplayFileStats: React.FC<ReplayFileStatsProps> = (props) => {
  const { file, index, total, onNext, onPrev, onClose } = props;
  const { settings, metadata } = file;

  const stageImage = settings.stageId
    ? getStageImage(settings.stageId)
    : undefined;
  const loading = useReplays((store) => store.selectedFile.loading);
  const error = useReplays((store) => store.selectedFile.error);
  const gameStats = useReplays((store) => store.selectedFile.gameStats);
  const numPlayers = settings.players.length;

  return (
    <Outer>
      <HeaderDiv backgroundImage={stageImage}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex" }}>
              <div>
                <Tooltip title="Back to replays">
                  <span>
                    <IconButton onClick={onClose} disabled={loading}>
                      <ArrowBackIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
              <GameProfileHeader metadata={metadata} settings={settings} />
            </div>
            <GameDetails file={file} stats={gameStats} />
          </div>
          <Controls
            disabled={loading}
            index={index}
            total={total}
            onNext={onNext}
            onPrev={onPrev}
            onPlay={() =>
              console.warn("Playing back replays is currently unsupported")
            }
          />
        </div>
      </HeaderDiv>
      {numPlayers !== 2 ? (
        <IconMessage Icon={ErrorIcon} label="Only singles is supported" />
      ) : loading ? (
        <LoadingScreen message={"Crunching numbers..."} />
      ) : error ? (
        <IconMessage
          Icon={ErrorIcon}
          label={`Error: ${error.message ?? JSON.stringify(error, null, 2)}`}
        />
      ) : gameStats ? (
        <GameProfile {...props} stats={gameStats}></GameProfile>
      ) : (
        <IconMessage Icon={HelpIcon} label="No stats computed" />
      )}
    </Outer>
  );
};

const HeaderDiv = styled.div<{
  backgroundImage?: any;
}>`
  z-index: 1;
  position: sticky;
  top: 0;
  width: 100%;
  border-bottom: solid 2px ${colors.grayDark};
  background-size: cover;
  background-position: center center;
  background-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.7) 0 30%,
      rgba(0, 0, 0, 0.8) 100%
    )
    ${(p) =>
      p.backgroundImage
        ? `,
    url("${p.backgroundImage}")`
        : ""};
`;

const GameDetails: React.FC<{
  file: FileResult;
  stats: StatsType | null;
}> = ({ file, stats }) => {
  let stageName = "Unknown";
  try {
    stageName = stageUtils.getStageName(
      file.settings.stageId ? file.settings.stageId : 0
    );
  } catch (err) {
    console.error(err);
  }

  const platform = _.get(file.metadata, "playedOn") || "Unknown";

  const startAtDisplay = new Date(
    file.startTime ? Date.parse(file.startTime) : 0
  );

  // Sometimes metadata doesn't exist and won't have the last frame
  // but we might have the stats computed which contains the real last frame.
  // In that situation, we should use that lastFrame not the metadata one.
  let duration = _.get(file.metadata, "lastFrame");
  if (duration === null || duration === undefined) {
    duration = _.get(stats, "lastFrame");
  }
  const durationLength =
    duration !== null && duration !== undefined
      ? convertFrameCountToDurationString(duration)
      : "Unknown";

  const displayData = [
    {
      label: "Stage",
      content: stageName,
    },
    {
      label: "Duration",
      content: durationLength,
    },
    {
      label: "Time",
      content: monthDayHourFormat(moment(startAtDisplay)) as string,
    },
    {
      label: "Platform",
      content: platform,
    },
  ];

  const metadataElements = displayData.map((details) => {
    return (
      <div key={details.label} style={{ margin: 10 }}>
        <DetailLabel>{details.label}</DetailLabel>
        <DetailContent>{details.content}</DetailContent>
      </div>
    );
  });

  return (
    <div style={{ display: "flex", padding: "0 10px" }}>{metadataElements}</div>
  );
};

const Controls: React.FC<{
  disabled?: boolean;
  index: number;
  total: number;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ disabled, index, total, onPlay, onPrev, onNext }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        margin: 10,
      }}
    >
      <div>
        <Button
          variant="outlined"
          onClick={onPlay}
          startIcon={<PlayArrowIcon />}
        >
          View Replay
        </Button>
      </div>
      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridAutoFlow: "column",
          alignItems: "center",
          justifyContent: "center",
          gridGap: 10,
        }}
      >
        <Tooltip title="Previous replay">
          <span>
            <IconButton
              disabled={disabled || index === 0}
              onClick={onPrev}
              size="small"
            >
              <ArrowBackIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <div style={{ fontSize: 12 }}>
          {index + 1} / {total}
        </div>
        <Tooltip title="Next replay">
          <span>
            <IconButton
              disabled={disabled || index === total - 1}
              onClick={onNext}
              size="small"
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

const DetailLabel = styled.label`
  font-weight: bold;
  opacity: 0.6;
  font-size: 14px;
  margin-right: 5px;
`;

// `text-transform: capitalize` doesn't work unless it's an inline-block
// See: https://stackoverflow.com/a/49783868 for more info
const DetailContent = styled.label`
  text-transform: capitalize;
  display: inline-block;
  font-size: 14px;
`;
