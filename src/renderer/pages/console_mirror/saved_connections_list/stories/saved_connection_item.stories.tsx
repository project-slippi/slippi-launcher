import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { OutdatedNintendontWarning } from "../saved_connection_item";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "pages/Mirroring/Outdated Nintendont Warning",
  component: OutdatedNintendontWarning,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof OutdatedNintendontWarning>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof OutdatedNintendontWarning> = () => <OutdatedNintendontWarning />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
