import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { NewsArticle } from "../NewsArticle";
import { generateFakeNewsItem } from "./fakeNewsItem";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "pages/home/news_feed/NewsArticle",
  component: NewsArticle,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof NewsArticle>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof NewsArticle> = (args) => <NewsArticle {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  item: generateFakeNewsItem({}),
};
