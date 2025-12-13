import { action } from "@storybook/addon-actions";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import type { GeckoCode } from "./manage_codes";
import { ManageCodes } from "./manage_codes";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "containers/Settings/ManageCodes",
  component: ManageCodes,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof ManageCodes>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof ManageCodes> = (args) => <ManageCodes {...args} />;

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

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  geckoCodes: fakeGeckoCodes,
  handleToggle: action("handleToggle"),
  handleCopy: action("handleCopy"),
  handleDelete: action("handleDelete"),
};
