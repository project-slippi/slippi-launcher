import { GameStartType, MetadataType } from "@slippi/slippi-js";
import { extractPlayerNames, PlayerNames } from "common/matchNames";
import styled from "styled-components";
import React from "react";
import { colors } from "../../../common/colors";
import { getCharacterIcon } from "@/lib/utils";

export interface GameProfileHeaderProps {
  metadata: MetadataType | null;
  settings: GameStartType;
}

const TagLabel = styled.label`
  color: ${colors.offWhite};
  background-color: ${colors.grayDark};
  padding: 6px;
  margin: 4px;
  font-size: 10px;
  font-weight: bold;
`;

const NameLabel = styled.label`
  color: ${colors.offWhite};
  font-size: 32px;
  margin-right: 6px;
`;

const CharIcon = styled.img`
  width: 36px;
`;

const TagsDiv = styled.div`
  margin: 0px 10px;
  padding: 10px;
  display: inline-block;
  vertical-align: middle;
`;

const VsSpan = styled.span`
  color: rgba(255, 255, 255, 0.5);
  line-height: 0.8;
  width: 20px;
  height: 18px;
  font-weight: bold;
  font-size: 1.4em;
  text-align: center;
`;

export const GameProfileHeader: React.FC<GameProfileHeaderProps> = ({
  metadata,
  settings,
}) => {
  const renderMatchupDisplay = () => {
    return (
      <div>
        {renderPlayerDisplay(0)}
        <VsSpan>vs</VsSpan>
        {renderPlayerDisplay(1)}
      </div>
    );
  };

  const renderPlayerDisplay = (index: number) => {
    const players = settings.players || [];
    const player = players[index];

    const allPlayerNames: PlayerNames[] = [];
    for (const p of settings.players) {
      const names = extractPlayerNames(p.playerIndex, settings, metadata);
      allPlayerNames.push(names);
    }

    const playerCode = allPlayerNames[player.playerIndex].code;

    return (
      <TagsDiv>
        <NameLabel>
          {allPlayerNames[player.playerIndex].name
            ? allPlayerNames[player.playerIndex].name
            : "Player " + (index + 1)}
        </NameLabel>
        <CharIcon
          src={getCharacterIcon(
            player.characterId ?? 0,
            player.characterColor ?? 0
          )}
        />
        <div style={{ height: "2px" }}></div>
        {playerCode ? <TagLabel>{playerCode}</TagLabel> : null}
      </TagsDiv>
    );
  };

  return <div>{renderMatchupDisplay()}</div>;
};
