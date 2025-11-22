import { partition } from "@common/partition";
import type { NewsItem } from "@common/types";
import log from "electron-log";

import { getBlueskyFeed } from "./bluesky";
import { getMediumFeed } from "./cross_origin/medium";
import { getAllReleases } from "./github";

export async function fetchNewsFeedData(): Promise<NewsItem[]> {
  const newsPromises: Promise<NewsItem[]>[] = [];
  newsPromises.push(fetchMediumNews());
  // newsPromises.push(fetchGithubReleaseNews(["Ishiiruka", "slippi-launcher", "dolphin"]));
  // newsPromises.push(fetchBlueskyPosts());
  const [allNews, failedNews] = partition<PromiseFulfilledResult<NewsItem[]>, PromiseRejectedResult>(
    await Promise.allSettled(newsPromises),
    (newsPromise) => newsPromise.status === "fulfilled",
  );

  // Log out the reason for the failed news promises
  failedNews.forEach((newsPromise) => {
    log.error(newsPromise.reason);
  });

  return allNews
    .flatMap((news) => news.value)
    .sort((a, b) => {
      // Sort all news item by reverse chronological order
      const aDate = new Date(a.publishedAt).getTime();
      const bDate = new Date(b.publishedAt).getTime();
      return bDate - aDate;
    });
}

async function fetchMediumNews(): Promise<NewsItem[]> {
  const result = await getMediumFeed();

  if (result.status !== "ok" || result.items === undefined) {
    log.error("Error fetching Medium feed:");
    log.error(result);
    return [];
  }

  return result.items.map((post): NewsItem => {
    // Parse the Medium pubDate format: "YYYY-MM-DD HH:MM:SS"
    const publishedAt = new Date(post.pubDate.replace(" ", "T") + "Z").toISOString();

    // Extract subtitle from description HTML (strip tags and truncate)
    let subtitle: string | undefined;
    if (post.description) {
      const textContent = post.description.replace(/<[^>]*>/g, "").trim();
      subtitle = textContent.length > 200 ? textContent.substring(0, 200) + "..." : textContent;
    }

    return {
      id: `medium-${post.guid}`,
      imageUrl: post.thumbnail || undefined,
      title: post.title,
      subtitle,
      publishedAt,
      permalink: post.link,
      body: post.content,
    };
  });
}

async function fetchGithubReleaseNews(repos: string[]): Promise<NewsItem[]> {
  const allReleases = await Promise.allSettled(
    repos.map(async (repo) => {
      const releases = await getAllReleases("project-slippi", repo);
      return releases.map((release): NewsItem => {
        return {
          id: `gh-${repo}-${release.id}`,
          title: `[${repo}] ${release.name}`,
          body: release.body,
          publishedAt: release.published_at,
          permalink: release.html_url,
        };
      });
    }),
  );

  return allReleases.flatMap((promise): NewsItem[] => {
    if (promise.status === "fulfilled") {
      return promise.value;
    }

    log.error(promise.reason);
    return [];
  });
}

async function fetchBlueskyPosts(): Promise<NewsItem[]> {
  const result = await getBlueskyFeed();
  if (result.error || result.feed === undefined) {
    log.error("Error fetching Bluesky feed:");
    log.error(result);
    return [];
  }

  const news = result.feed.map((entry): NewsItem => {
    const post = entry.post;
    const publishedAt = new Date(post.record.createdAt).toISOString();
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
