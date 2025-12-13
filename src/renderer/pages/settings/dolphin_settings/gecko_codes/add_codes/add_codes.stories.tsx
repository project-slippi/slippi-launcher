import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { action } from "storybook/actions";

import { AddCodes } from "./add_codes";

const meta = {
  title: "containers/Settings/AddCodes",
  component: AddCodes,
} satisfies Meta<typeof AddCodes>;
export default meta;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    validateCodeInput: () => {
      return true;
    },
    onSubmit: action("onSubmit"),
  },
};
