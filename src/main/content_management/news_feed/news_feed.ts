import type { NewsItem } from "@common/types";

import { NewsAggregator } from "./news_aggregator";
import { BlueskyNewsSource } from "./news_sources/bluesky_news_source";
import { GithubNewsSource } from "./news_sources/github_news_source";
import { MediumNewsSource } from "./news_sources/medium_news_source";

// Only show news items published within the last year
const NEWS_CUTOFF_DAYS = 365;

const newsAggregator = new NewsAggregator(NEWS_CUTOFF_DAYS);
newsAggregator.addSource(new MediumNewsSource());
newsAggregator.addSource(new GithubNewsSource());
newsAggregator.addSource(new BlueskyNewsSource());

export async function fetchNewsFeedData(): Promise<readonly NewsItem[]> {
  return newsAggregator.fetch();
}
