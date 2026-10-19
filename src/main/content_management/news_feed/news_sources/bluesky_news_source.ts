import log from "electron-log";
import { getBlueskyFeed } from "main/fetch_cross_origin/bluesky";

import type { BaseNewsItem, NewsSource } from "../types";

export class BlueskyNewsSource implements NewsSource {
  readonly id = "bluesky" as const;

  async fetch(): Promise<readonly BaseNewsItem[]> {
    const start = Date.now();
    log.info("Fetching Bluesky posts...");
    const threads = await getBlueskyFeed("did:plc:6xwud4csg7p7243ptrc5sa5y");

    log.info(`Bluesky posts fetched in ${Date.now() - start}ms`);

    const news = threads.map(({ post, replies }): BaseNewsItem => {
      const publishedAt = new Date(post.record.createdAt);
      return {
        id: `bluesky-${post.cid}`,
        title: post.author.displayName,
        imageUrl: post.author.avatar,
        // Show the whole thread as a single post, with a markdown horizontal rule between each part
        body: [post, ...replies].map((p) => p.record.text).join("\n\n---\n\n"),
        subtitle: post.author.handle,
        publishedAt,
        permalink: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").slice(-1)[0]}`,
      };
    });
    return news;
  }
}
