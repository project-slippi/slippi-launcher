import type { Meta, StoryObj } from "@storybook/react-webpack5";

import { NewsArticle } from "../news_article";
import { generateFakeNewsItem } from "./fakes";

const meta = {
  title: "pages/home/news_feed/NewsArticle",
  component: NewsArticle,
} satisfies Meta<typeof NewsArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    item: generateFakeNewsItem({}),
    currentLanguage: "en",
  },
};
