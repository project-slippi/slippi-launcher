import type { NewsItem } from "@common/types";
import log from "electron-log";
import mediumJSONFeed from "medium-json-feed";

import { getBlueskyFeed } from "./bluesky";
import { getAllReleases } from "./github";

export async function fetchNewsFeedData(): Promise<NewsItem[]> {
  const mediumNews = fetchMediumNews();
  const githubNews = fetchGithubReleaseNews(["Ishiiruka", "slippi-launcher", "dolphin"]);
  const blueskyNews = fetchBlueskyPosts();
  const allNews = (await Promise.allSettled([mediumNews, githubNews, blueskyNews]))
    .filter((news) => news.status === "fulfilled")
    .flatMap((news) => news.value);
  return allNews.sort((a, b) => {
    // Sort all news item by reverse chronological order
    const aDate = new Date(a.publishedAt).getTime();
    const bDate = new Date(b.publishedAt).getTime();
    return bDate - aDate;
  });
}

async function fetchMediumNews(): Promise<NewsItem[]> {
  const response = await mediumJSONFeed("project-slippi");
  if (response?.status !== 200) {
    throw new Error("Error fetching Medium feed");
  }

  const result = response.response;
  return result.map((post: any): NewsItem => {
    const publishedAt = new Date(post.firstPublishedAt).toISOString();
    return {
      id: `medium-${post.id}`,
      imageUrl: `https://cdn-images-1.medium.com/${post.virtuals.previewImage.imageId}`,
      title: post.title,
      subtitle: post.virtuals.subtitle,
      publishedAt,
      permalink: `https://medium.com/project-slippi/${post.uniqueSlug}`,
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
