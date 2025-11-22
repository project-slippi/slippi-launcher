import { partition } from "@common/partition";
import type { NewsItem } from "@common/types";
import log from "electron-log";

import { getBlueskyFeed } from "./bluesky";
import { getAllReleases } from "./github";
import { getMediumFeed } from "./medium";

export async function fetchNewsFeedData(): Promise<NewsItem[]> {
  const newsPromises: Promise<NewsItem[]>[] = [];
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

  // TODO: Change error check condition. This stuff is old from when I tried to use RSS data directly
  if (result.status !== "ok" || result.items === undefined) {
    log.error("Error fetching Medium feed:");
    log.error(result);
    return [];
  }

  return result.items.map((post): NewsItem => {
    const publishedAt = new Date(post.latestPublishedAt).toISOString();
    return {
      id: `medium-${post.id}`,
      imageUrl: `https://cdn-images-1.medium.com/${post.previewImage.id}`,
      title: post.title,
      subtitle: post.extendedPreviewContent.subtitle,
      publishedAt,
      permalink: post.mediumUrl,
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
