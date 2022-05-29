import type { NewsItem } from "@common/types";
import mediumJSONFeed from "medium-json-feed";

import { getAllReleases } from "./github";

export async function fetchNewsFeedData(): Promise<NewsItem[]> {
  const mediumNews = fetchMediumNews();
  const githubNews = fetchGithubReleaseNews(["Ishiiruka", "slippi-launcher"]);
  const allNews = (await Promise.all([mediumNews, githubNews])).flat();
  return allNews.sort((a, b) => {
    // Sort all news item by reverse chronological order
    const aDate = new Date(a.publishedAt).getTime();
    const bDate = new Date(b.publishedAt).getTime();
    return bDate - aDate;
  });
}

async function fetchMediumNews(): Promise<NewsItem[]> {
  const response = await mediumJSONFeed("project-slippi");
  if (!response || response.status !== 200) {
    throw new Error("Error fetching Medium feed");
  }

  const result = response.response;
  return result.map((post: any) => {
    const publishedAt = new Date(post.firstPublishedAt).toISOString();
    return {
      id: `medium-${post.id}`,
      imageUrl: `https://cdn-images-1.medium.com/${post.virtuals.previewImage.imageId}`,
      title: post.title,
      subtitle: post.virtuals.subtitle,
      publishedAt,
      permalink: `https://medium.com/project-slippi/${post.uniqueSlug}`,
    } as NewsItem;
  });
}

async function fetchGithubReleaseNews(repos: string[]): Promise<NewsItem[]> {
  const allReleases = await Promise.all(
    repos.map(async (repo) => {
      const releases = await getAllReleases("project-slippi", repo);
      return releases.map((release: any) => {
        return {
          id: `gh-${repo}-${release.id}`,
          title: `[${repo}] ${release.name}`,
          body: release.body,
          publishedAt: release.published_at,
          permalink: release.html_url,
        } as NewsItem;
      });
    }),
  );

  return allReleases.flat();
}
