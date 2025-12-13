import type { Meta, StoryObj } from "@storybook/react-webpack5";

import { BouncingSlippiLogo } from "./bouncing_slippi_logo";

const meta = {
  title: "Components/BouncingSlippiLogo",
  component: BouncingSlippiLogo,
} satisfies Meta<typeof BouncingSlippiLogo>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};
