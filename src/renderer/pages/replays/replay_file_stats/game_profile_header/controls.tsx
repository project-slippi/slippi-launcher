import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { DolphinStatus, useDolphinStore } from "@/lib/dolphin/use_dolphin_store";

import styles from "../game_profile_header.module.css";
import { GameProfileHeaderMessages as Messages } from "./game_profile_header.messages";

type Props = {
  disabled?: boolean;
  index?: number;
  total?: number;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
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

export const Controls = ({ disabled, index, total, onPlay, onPrev, onNext }: Props) => {
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
