import type { PlayerInfo } from "./TeamElements";
import { TeamElements } from "./TeamElements";

export default {
  title: "containers/ReplayBrowser/ReplayFile/TeamElements",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

export const OneVsOne = () => {
  const oneVsOneTeams: PlayerInfo[][] = [
    [generatePlayer({ text: "Player 1", port: 1, isWinner: true })],
    [generatePlayer({ text: "Player 2", port: 2 })],
  ];
  return <TeamElements teams={oneVsOneTeams} />;
};

export const TwoVsTwo = () => {
  const twoVsTwoTeams: PlayerInfo[][] = [
    [
      generatePlayer({ text: "Player 1", port: 1, teamId: 0 }),
      generatePlayer({ text: "Player 2", port: 2, teamId: 0 }),
    ],
    [
      generatePlayer({ text: "Player 3", port: 3, teamId: 1, isWinner: true }),
      generatePlayer({ text: "Player 4", port: 4, teamId: 1, isWinner: true }),
    ],
  ];
  return <TeamElements teams={twoVsTwoTeams} />;
};

export const FreeForAll = () => {
  const freeForAllTeams: PlayerInfo[][] = [
    [generatePlayer({ text: "Player 1", port: 1 })],
    [generatePlayer({ text: "Player 2", port: 2 })],
    [generatePlayer({ text: "Player 3", port: 3, isWinner: true })],
    [generatePlayer({ text: "Player 4", port: 4 })],
  ];
  return <TeamElements teams={freeForAllTeams} />;
};

const generatePlayer = (options: Partial<PlayerInfo>): PlayerInfo => {
  return {
    text: "Player 1",
    port: 1,
    characterColor: 0,
    characterId: 0,
    ...options,
  };
};
