import type { ComponentMeta, ComponentStory } from "@storybook/react-webpack5";

import { BouncingSlippiLogo } from "./bouncing_slippi_logo";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Components/BouncingSlippiLogo",
  component: BouncingSlippiLogo,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof BouncingSlippiLogo>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof BouncingSlippiLogo> = () => <BouncingSlippiLogo />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
