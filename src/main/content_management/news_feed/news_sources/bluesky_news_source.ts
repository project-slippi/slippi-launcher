import log from "electron-log";
import { getBlueskyFeed } from "main/fetch_cross_origin/bluesky";

import type { BaseNewsItem, NewsSource } from "../types";

export class BlueskyNewsSource implements NewsSource {
  readonly id = "bluesky" as const;

  async fetch(): Promise<readonly BaseNewsItem[]> {
    const start = Date.now();
    log.info("Fetching Bluesky posts...");
    const feed = await getBlueskyFeed("did:plc:6xwud4csg7p7243ptrc5sa5y");

    log.info(`Bluesky posts fetched in ${Date.now() - start}ms`);

    const news = feed.map((entry): BaseNewsItem => {
      const post = entry.post;
      const publishedAt = new Date(post.record.createdAt);
      return {
        id: `bluesky-${post.cid}`,
        title: post.author.displayName,
        imageUrl: post.author.avatar,
        body: post.record.text,
        subtitle: `@${post.author.handle}`,
        publishedAt,
        permalink: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").slice(-1)[0]}`,
      };
    });
    return news;
  }
}
