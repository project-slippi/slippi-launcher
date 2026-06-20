import log from "electron-log";
import { getMediumFeed } from "main/fetch_cross_origin/medium";
import TurndownService from "turndown";

import type { BaseNewsItem, NewsSource } from "../types";

export class MediumNewsSource implements NewsSource {
  readonly id = "medium" as const;

  private readonly turndownService = new TurndownService();

  async fetch(): Promise<readonly BaseNewsItem[]> {
    const start = Date.now();
    log.info("Fetching Medium news...");
    const result = await getMediumFeed("project-slippi");

    if (result.status !== "ok" || result.items === undefined) {
      log.error("Error fetching Medium feed:");
      log.error(result);
      return [];
    }

    log.info(`Medium news fetched in ${Date.now() - start}ms`);

    return result.items.map((post): BaseNewsItem => {
      // Parse the Medium pubDate format: "YYYY-MM-DD HH:MM:SS"
      const publishedAt = new Date(post.pubDate.replace(" ", "T") + "Z");
      // The NewsItem content needs to be in markdown format so convert the raw HTML content to markdown
      const bodyMarkdown = this.turndownService.turndown(post.content);

      // The post.guid from Medium can contain special characters that break the id string
      const safeId = makeUrlSafe(post.guid);
      return {
        id: `medium-${safeId}`,
        imageUrl: post.thumbnail || undefined,
        title: post.title,
        subtitle: undefined, // There is no subtitle content fetched from the Medium RSS feed
        publishedAt,
        permalink: post.link,
        body: bodyMarkdown,
      };
    });
  }
}

function makeUrlSafe(text: string) {
  const encoded = Buffer.from(text, "utf8").toString("base64");
  const urlSafe = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return urlSafe;
}
