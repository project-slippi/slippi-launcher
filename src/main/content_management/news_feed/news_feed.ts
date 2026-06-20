import { partition } from "@common/partition";
import type { NewsItem } from "@common/types";
import electronLog from "electron-log";

import { BlueskyNewsSource } from "./news_sources/bluesky_news_source";
import { GithubNewsSource } from "./news_sources/github_news_source";
import { MediumNewsSource } from "./news_sources/medium_news_source";
import type { NewsSource } from "./types";

const log = electronLog.scope("news_feed");

class NewsFeedAggregator {
  private sources: NewsSource[] = [];

  register(source: NewsSource) {
    this.sources.push(source);
  }

  async fetch(): Promise<readonly NewsItem[]> {
    const totalStart = Date.now();
    const newsPromises: Promise<NewsItem[]>[] = [];
    log.info("Fetching news feed data...");
    this.sources.forEach((source) => {
      newsPromises.push(
        source.fetch().then((items) => items.map((item): NewsItem => ({ ...item, source: source.id }))),
      );
    });
    const [allNews, failedNews] = partition<PromiseFulfilledResult<NewsItem[]>, PromiseRejectedResult>(
      await Promise.allSettled(newsPromises),
      (newsPromise) => newsPromise.status === "fulfilled",
    );

    // Log out the reason for the failed news promises
    failedNews.forEach((newsPromise) => {
      log.error(newsPromise.reason);
    });

    log.info(`Total fetchNewsFeedData completed in ${Date.now() - totalStart}ms`);

    return allNews.flatMap((news) => news.value).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}

const newsFeedAggregator = new NewsFeedAggregator();
newsFeedAggregator.register(new MediumNewsSource());
newsFeedAggregator.register(new GithubNewsSource(["Ishiiruka", "slippi-launcher", "dolphin"]));
newsFeedAggregator.register(new BlueskyNewsSource());

export async function fetchNewsFeedData(): Promise<readonly NewsItem[]> {
  return newsFeedAggregator.fetch();
}
