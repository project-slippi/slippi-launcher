import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { action } from "storybook/actions";

import type { GeckoCode } from "./manage_codes";
import { ManageCodes } from "./manage_codes";

const meta = {
  title: "containers/Settings/ManageCodes",
  component: ManageCodes,
} satisfies Meta<typeof ManageCodes>;
export default meta;

type Story = StoryObj<typeof meta>;

const aFakeGeckoCodeWith = (opts: Partial<GeckoCode> = {}) => {
  return {
    name: "Fake Gecko Code Name",
    enabled: true,
    userDefined: false,
    notes: ["Some sort of description"],
    ...opts,
  };
};

const fakeGeckoCodes: GeckoCode[] = [
  aFakeGeckoCodeWith({
    name: "Some super duper really really really really really really long name",
  }),
  aFakeGeckoCodeWith({
    userDefined: true,
    notes: [
      "Some super duper really really really really really really long description.",
      "Some super duper really really really really really really long description.",
      "Some super duper really really really really really really long description.",
    ],
  }),
  aFakeGeckoCodeWith({ userDefined: true }),
];

export const Primary: Story = {
  args: {
    geckoCodes: fakeGeckoCodes,
    handleToggle: action("handleToggle"),
    handleCopy: action("handleCopy"),
    handleDelete: action("handleDelete"),
  },
};
