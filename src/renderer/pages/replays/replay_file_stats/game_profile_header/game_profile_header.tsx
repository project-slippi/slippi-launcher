import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { PlayerInfo as PlayerInfoType } from "@replays/types";
import type { GameMode } from "@slippi/slippi-js";
import { groupBy } from "common/group_by";
import React from "react";

import styles from "../game_profile_header.module.css";
import { PlayerInfo } from "../player_info";
import { Controls } from "./controls";
import { GameDetails } from "./game_details";
import { GameProfileHeaderMessages as Messages } from "./game_profile_header.messages";

type PlayerInfoDisplayProps = {
  isTeams?: boolean;
  players: PlayerInfoType[];
};

const PlayerInfoDisplay = ({ isTeams, players }: PlayerInfoDisplayProps) => {
  const teams = Object.values(groupBy(players, (p) => (isTeams ? p.teamId : p.port)));
  const elements: React.ReactNode[] = [];
  teams.forEach((team, idx) => {
    const teamEls = team.map((player) => (
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
    ));
    elements.push(
      <div key={`team-${idx}`} style={{ display: "flex" }}>
        {...teamEls}
      </div>,
    );
    // Add VS obj in between teams
    if (idx < teams.length - 1) {
      // If this is not the last team, add a "vs" element
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
  players: PlayerInfoType[];
  isTeams: boolean;
  index?: number;
  total?: number;
  gameDetails: {
    stageName: string;
    platform: string;
    startAtDisplay: Date;
    duration: string;
    gameMode: GameMode;
    distance?: number;
    units?: string;
  };
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onClose: () => void;
  disabled?: boolean;
};

export const GameProfileHeader = ({
  players,
  isTeams,
  index,
  total,
  gameDetails,
  onNext,
  onPrev,
  onPlay,
  onClose,
  disabled,
}: GameProfileHeaderProps) => (
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
        <PlayerInfoDisplay players={players} isTeams={isTeams} />
      </div>
      <GameDetails {...gameDetails} />
    </div>
    <Controls disabled={disabled} index={index} total={total} onNext={onNext} onPrev={onPrev} onPlay={onPlay} />
  </div>
);
