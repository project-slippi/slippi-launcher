import _ from "lodash";
import { getCharacterIcon } from "@/lib/utils";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import React from "react";
import styled from "styled-components";
import { makeStyles } from "@material-ui/core/styles";
import { GameStartType, MetadataType, PlayerType } from "@slippi/slippi-js";
import { extractPlayerNames, PlayerNames } from "common/matchNames";

const useStyles = makeStyles({
  labelSmall: {
    fontSize: 12,
    opacity: 0.8,
    backgroundColor: "#2D313A",
  },
});

interface PlayerIndicatorProps {
  player: PlayerType;
  names: PlayerNames;
  isTeams?: boolean;
}

const PlayerIndicator: React.FC<PlayerIndicatorProps> = ({ player, names }) => {
  const classes = useStyles();
  const backupName = player.type === 1 ? "CPU" : "Player";
  const charIcon = getCharacterIcon(
    player.characterId ?? 0,
    player.characterColor ?? 0
  );
  // const teamId = isTeams ? player.teamId : null;
  return (
    <PlayerInfo>
      <Typography
        variant="h6"
        style={{ display: "flex", alignItems: "center" }}
      >
        <img src={charIcon} />
        {names.name || names.tag || `${backupName} ${player.port}`}
      </Typography>
      {names.code && (
        <div style={{ textAlign: "center" }}>
          <Chip
            className={classes.labelSmall}
            size="small"
            label={names.code}
          />
        </div>
      )}
    </PlayerInfo>
  );
};

const PlayerInfo = styled.div`
  margin: 0 15px;
  display: flex;
  flex-direction: column;
  font-size: 22px;
  img {
    width: 32px;
    margin-right: 8px;
  }
`;

const Outer = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export interface GameProfileHeaderProps {
  settings: GameStartType;
  metadata: MetadataType | null;
}

export const GameProfileHeader: React.FC<GameProfileHeaderProps> = ({
  settings,
  metadata,
}) => {
  const teams = _.chain(settings.players)
    .groupBy((player) => (settings.isTeams ? player.teamId : player.port))
    .toArray()
    .value();

  const elements: JSX.Element[] = [];
  teams.forEach((team, idx) => {
    team.forEach((player) => {
      const names = extractPlayerNames(player.playerIndex, settings, metadata);
      elements.push(
        <PlayerIndicator
          key={`player-${player.playerIndex}`}
          player={player}
          isTeams={Boolean(settings.isTeams)}
          names={names}
        />
      );
    });

    // Add VS obj in between teams
    if (idx < teams.length - 1) {
      // If this is not the last team, add a "vs" element
      elements.push(
        <div
          key={`vs-${idx}`}
          style={{
            fontWeight: "bold",
            color: "rgba(255, 255, 255, 0.5)",
            padding: "0 20px",
            fontSize: 20,
          }}
        >
          vs
        </div>
      );
    }
  });
  return <Outer>{...elements}</Outer>;
};
