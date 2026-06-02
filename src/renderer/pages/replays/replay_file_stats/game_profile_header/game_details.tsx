import EventIcon from "@mui/icons-material/Event";
import LandscapeIcon from "@mui/icons-material/Landscape";
import SportsCricket from "@mui/icons-material/SportsCricket";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import Straighten from "@mui/icons-material/Straighten";
import TimerIcon from "@mui/icons-material/Timer";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import { GameMode } from "@slippi/slippi-js";
import React from "react";

import { monthDayHourFormat } from "@/lib/time";

import styles from "../game_profile_header.module.css";
import { GameProfileHeaderMessages as Messages } from "./game_profile_header.messages";

type Props = {
  stageName: string;
  platform: string;
  startAtDisplay: Date;
  duration: string;
  gameMode: GameMode;
  distance?: number;
  units?: string;
};

export const GameDetails = ({ stageName, platform, startAtDisplay, duration, gameMode, distance, units }: Props) => {
  const eventDisplay = { label: <EventIcon />, content: monthDayHourFormat(startAtDisplay) };
  const timerDisplay = { label: <TimerIcon />, content: duration };
  const stageDisplay = { label: <LandscapeIcon />, content: stageName };
  const platformDisplay = { label: <SportsEsportsIcon />, content: platform };
  const targetTestDisplay = { label: <TrackChangesIcon />, content: Messages.targetTest() };
  const homerunDisplay = { label: <SportsCricket />, content: Messages.homeRunContest() };
  const distanceDisplay = { label: <Straighten />, content: `${distance} ${units}` };

  let displayData: { label: React.ReactNode; content: React.ReactNode }[];
  switch (gameMode) {
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

  return (
    <div className={styles.metadataContainer}>
      {displayData.map((details, i) => (
        <div key={`item-${i}-${details.content}`} className={styles.metadataItem}>
          <label className={styles.detailLabel}>{details.label}</label>
          <label className={styles.detailContent}>{details.content}</label>
        </div>
      ))}
    </div>
  );
};
