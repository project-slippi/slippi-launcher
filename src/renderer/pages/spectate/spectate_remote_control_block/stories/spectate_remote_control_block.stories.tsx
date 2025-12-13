import type { Meta } from "@storybook/react-webpack5";
import { action } from "storybook/actions";

import { SpectateRemoteControlBlock } from "../spectate_remote_control_block";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "pages/spectate/SpectateRemoteControlBlock",
  component: SpectateRemoteControlBlock,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as Meta<typeof SpectateRemoteControlBlock>;

export const Default = () => {
  return (
    <SpectateRemoteControlBlock
      serverStatus="started"
      connected={true}
      port={8080}
      onStart={action("onStart")}
      onStop={action("onStop")}
    />
  );
};

export const Starting = () => {
  return (
    <SpectateRemoteControlBlock
      serverStatus="starting"
      connected={false}
      port={8080}
      onStart={action("onStart")}
      onStop={action("onStop")}
    />
  );
};

export const Stopped = () => {
  return (
    <SpectateRemoteControlBlock
      serverStatus="stopped"
      connected={false}
      port={8080}
      onStart={action("onStart")}
      onStop={action("onStop")}
    />
  );
};

export const Error = () => {
  return (
    <SpectateRemoteControlBlock
      serverStatus="started"
      connected={true}
      port={8080}
      errorMessage="Error starting server"
      onStart={action("onStart")}
      onStop={action("onStop")}
    />
  );
};
