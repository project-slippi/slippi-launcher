import EqualizerIcon from "@mui/icons-material/Equalizer";
import EventIcon from "@mui/icons-material/Event";
import LandscapeIcon from "@mui/icons-material/Landscape";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import TimerIcon from "@mui/icons-material/Timer";
import { action } from "@storybook/addon-actions";

import { ReplayFile } from "../replay_file";
import type { PlayerInfo } from "../team_elements/team_elements";
import stageImage from "./stage.png";

export default {
  title: "containers/ReplayBrowser/ReplayFile",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

export const Standard = () => {
  return renderReplayFileWith();
};

export const Selected = () => {
  return (
    <div>
      <div>{renderReplayFileWith({ selectedIndex: 1 })}</div>
      <div>{renderReplayFileWith({ selectedIndex: 11 })}</div>
      <div>{renderReplayFileWith({ selectedIndex: 111 })}</div>
      <div>{renderReplayFileWith({ selectedIndex: 1111 })}</div>
    </div>
  );
};

export const ReallyLongReplayName = () => {
  return renderReplayFileWith({ title: "a_super_special_awesome_replay_with_a_reeeeaaaaaaaally_looooooong_name.slp" });
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

type ReplayFileProps = React.ComponentProps<typeof ReplayFile>;

const renderReplayFileWith = (additionalProps: Partial<ReplayFileProps> = {}) => {
  const freeForAllTeams: PlayerInfo[][] = [
    [generatePlayer({ text: "Player 1", port: 1 })],
    [generatePlayer({ text: "Player 2", port: 2 })],
    [generatePlayer({ text: "Player 3", port: 3, isWinner: true })],
    [generatePlayer({ text: "Player 4", port: 4 })],
  ];
  const props: ReplayFileProps = {
    players: freeForAllTeams,
    title: "some_game_file.slp",
    backgroundImage: stageImage,
    details: [
      {
        Icon: EventIcon,
        label: "label1",
      },
      {
        Icon: TimerIcon,
        label: "label2",
      },
      {
        Icon: LandscapeIcon,
        label: "label3",
      },
    ],
    actions: [
      {
        Icon: MoreHorizIcon,
        label: "action1",
        onClick: action("action1"),
      },
      {
        Icon: EqualizerIcon,
        label: "action2",
        onClick: action("action2"),
      },
      {
        Icon: PlayCircleOutlineIcon,
        label: "action3",
        onClick: action("action3"),
        primary: true,
      },
    ],
    ...additionalProps,
  };
  return <ReplayFile {...props} />;
};
