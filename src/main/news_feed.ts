import { partition } from "@common/partition";
import type { NewsItem } from "@common/types";
import electronLog from "electron-log";
import TurndownService from "turndown";

import { getBlueskyFeed } from "./fetch_cross_origin/bluesky";
import { getAllReleases } from "./fetch_cross_origin/github";
import { getMediumFeed } from "./fetch_cross_origin/medium";

const log = electronLog.scope("news_feed");

const turndownService = new TurndownService();

export async function fetchNewsFeedData(): Promise<NewsItem[]> {
  const totalStart = Date.now();
  const newsPromises: Promise<NewsItem[]>[] = [];
  log.info("Fetching news feed data...");
  newsPromises.push(fetchMediumNews());
  newsPromises.push(fetchGithubReleaseNews(["Ishiiruka", "slippi-launcher", "dolphin"]));
  newsPromises.push(fetchBlueskyPosts());
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

async function fetchMediumNews(): Promise<NewsItem[]> {
  const start = Date.now();
  log.info("Fetching Medium news...");
  const result = await getMediumFeed("project-slippi");

  if (result.status !== "ok" || result.items === undefined) {
    log.error("Error fetching Medium feed:");
    log.error(result);
    return [];
  }

  log.info(`Medium news fetched in ${Date.now() - start}ms`);

  return result.items.map((post): NewsItem => {
    // Parse the Medium pubDate format: "YYYY-MM-DD HH:MM:SS"
    const publishedAt = new Date(post.pubDate.replace(" ", "T") + "Z");
    // The NewsItem content needs to be in markdown format so convert the raw HTML content to markdown
    const bodyMarkdown = turndownService.turndown(post.content);

    // The post.guid from Medium can contain special characters that break the id string
    const safeId = makeUrlSafe(post.guid);
    return {
      id: `medium-${safeId}`,
      source: "medium",
      imageUrl: post.thumbnail || undefined,
      title: post.title,
      subtitle: undefined, // There is no subtitle content fetched from the Medium RSS feed
      publishedAt,
      permalink: post.link,
      body: bodyMarkdown,
    };
  });
}

async function fetchGithubReleaseNews(repos: string[]): Promise<NewsItem[]> {
  const start = Date.now();
  log.info(`Fetching Github releases for ${repos.join(", ")}...`);
  const allReleases = await Promise.allSettled(
    repos.map(async (repo) => {
      const releases = await getAllReleases("project-slippi", repo);
      return releases.map((release): NewsItem => {
        return {
          id: `gh-${repo}-${release.id}`,
          source: "github",
          title: `[${repo}] ${release.name}`,
          body: release.body,
          publishedAt: new Date(release.published_at),
          permalink: release.html_url,
        };
      });
    }),
  );

  log.info(`Github releases fetched in ${Date.now() - start}ms`);

  return allReleases.flatMap((promise): NewsItem[] => {
    if (promise.status === "fulfilled") {
      return promise.value;
    }

    log.error(promise.reason);
    return [];
  });
}

async function fetchBlueskyPosts(): Promise<NewsItem[]> {
  const start = Date.now();
  log.info("Fetching Bluesky posts...");
  const feed = await getBlueskyFeed("did:plc:6xwud4csg7p7243ptrc5sa5y");

  log.info(`Bluesky posts fetched in ${Date.now() - start}ms`);

  const news = feed.map((entry): NewsItem => {
    const post = entry.post;
    const publishedAt = new Date(post.record.createdAt);
    return {
      id: `bluesky-${post.cid}`,
      source: "bluesky",
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

function makeUrlSafe(text: string) {
  const encoded = Buffer.from(text, "utf8").toString("base64");
  const urlSafe = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return urlSafe;
}
