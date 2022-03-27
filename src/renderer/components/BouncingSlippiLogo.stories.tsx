import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { BouncingSlippiLogo } from "./BouncingSlippiLogo";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Components/BouncingSlippiLogo",
  component: BouncingSlippiLogo,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof BouncingSlippiLogo>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof BouncingSlippiLogo> = (args) => <BouncingSlippiLogo {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
