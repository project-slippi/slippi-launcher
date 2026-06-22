import { partition } from "@common/partition";
import type { NewsItem } from "@common/types";
import electronLog from "electron-log";

import type { NewsSource } from "./types";

const log = electronLog.scope("news_feed");

export class NewsAggregator {
  private readonly newsCutoffMs: number;
  private readonly sources: NewsSource[] = [];

  /**
   * @param newsCutoffDays - Number of days to include in the news feed. If 0, include all news items.
   */
  constructor(newsCutoffDays: number = 0) {
    this.newsCutoffMs = newsCutoffDays * 24 * 60 * 60 * 1000;
  }

  addSource(source: NewsSource) {
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

    let newsToReturn = allNews.flatMap((news) => news.value);

    if (this.newsCutoffMs) {
      const cutoff = Date.now() - this.newsCutoffMs;
      newsToReturn = newsToReturn.filter((item) => item.publishedAt.getTime() > cutoff);
    }

    return newsToReturn.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}
