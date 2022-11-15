import { PlayerBadge } from "./PlayerBadge";

type PlayerBadgeProps = React.ComponentProps<typeof PlayerBadge>;

export default {
  title: "containers/ReplayBrowser/ReplayFile/TeamElements/PlayerBadge",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

export const NullValues = () => {
  return generateBadge({ characterId: null, characterColor: null });
};

export const TagVariants = () => {
  return (
    <div>
      <div style={{ padding: "10px 0" }}>{generateBadge({ isWinner: true, text: "A" })}</div>
      <div style={{ padding: "10px 0" }}>{generateBadge({ isWinner: true, text: "A longer tag" })}</div>
      <div style={{ padding: "10px 0" }}>{generateBadge({ isWinner: true, text: "A really really long tag" })}</div>
    </div>
  );
};

export const ConnectCodeVariant = () => {
  return generateBadge({ variant: "code", text: "ABC#123" });
};

export const WinnerVariants = () => {
  return generateBadgeRow({ variant: "code", text: "ABC#123", isWinner: true });
};

export const AllCharacterBadges = () => {
  const badges: React.ReactNode[] = [];
  for (let i = 0; i <= 25; i++) {
    badges.push(<div key={i}>{generateBadgeRow({ characterId: i })}</div>);
  }
  return <div>{badges}</div>;
};

const defaultProps: PlayerBadgeProps = {
  variant: "tag",
  characterId: 20,
  characterColor: 0,
  port: 1,
  text: "Player 1",
};

function generateBadge(options: Partial<PlayerBadgeProps>) {
  return <PlayerBadge {...defaultProps} {...options} />;
}

function generateBadgeRow(options: Partial<PlayerBadgeProps>) {
  const badges = [1, 2, 3, 4].map((port) => {
    return (
      <div style={{ display: "inline-block", padding: "0 5px" }} key={port}>
        {generateBadge({ port, text: `Player ${port}`, ...options })}
      </div>
    );
  });
  return <div style={{ padding: "5px 0" }}>{badges}</div>;
}
