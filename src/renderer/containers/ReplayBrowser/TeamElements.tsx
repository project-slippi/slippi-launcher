import { getCharacterIcon } from "@/lib/utils";
import Chip from "@material-ui/core/Chip";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import { getPortColor, getTeamColor } from "common/colors";
import React from "react";
import styled from "styled-components";
import { makeStyles } from "@material-ui/core/styles";
import { GameStartType, MetadataType, PlayerType } from "@slippi/slippi-js";
import { extractPlayerNames } from "common/matchNames";

function getColor(port: number, teamId: number | null) {
  if (teamId !== null) {
    return getTeamColor(teamId);
  }
  return getPortColor(port);
}

const useStyles = makeStyles<any, { backgroundColor: string }>({
  badge: {
    backgroundColor: (props) => props.backgroundColor,
  },
});

interface PlayerIndicatorProps {
  player: PlayerType;
  name: string;
  isTeams?: boolean;
}

const PlayerIndicator: React.FC<PlayerIndicatorProps> = ({
  player,
  name,
  isTeams,
}) => {
  const charIcon = getCharacterIcon(
    player.characterId ?? 0,
    player.characterColor ?? 0
  );
  const teamId = isTeams ? player.teamId : null;
  const color = getColor(player.port, teamId);
  const classes = useStyles({ backgroundColor: color });

  return (
    <Badge
      component="div"
      classes={{ badge: classes.badge }}
      badgeContent={`P${player.port}`}
    >
      <Chip
        avatar={<Avatar alt="Natacha" src={charIcon} variant="square" />}
        label={name}
      />
    </Badge>
  );
};

const Outer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 15px;
  & > div {
    margin-right: 15px;
  }
`;

export interface TeamElementProps {
  teams: PlayerType[][];
  settings: GameStartType;
  metadata: MetadataType | null;
}

export const TeamElements: React.FC<TeamElementProps> = ({
  teams,
  settings,
  metadata,
}) => {
  const elements: JSX.Element[] = [];
  teams.forEach((team, idx) => {
    team.forEach((player) => {
      const backupName = player.type === 1 ? "CPU" : "Player";
      const names = extractPlayerNames(player.playerIndex, settings, metadata);
      elements.push(
        <PlayerIndicator
          key={`player-${player.playerIndex}`}
          player={player}
          isTeams={Boolean(settings.isTeams)}
          name={names.code || names.tag || backupName}
        />
      );
    });

    // Add VS obj in between teams
    if (idx < teams.length - 1) {
      // If this is not the last team, add a "vs" element
      elements.push(
        <div key={`vs-${idx}`} style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          vs
        </div>
      );
    }
  });
  return <Outer>{...elements}</Outer>;
};
