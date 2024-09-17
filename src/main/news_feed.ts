import { socials } from "@common/constants";
import type { NewsItem } from "@common/types";
import log from "electron-log";
import mediumJSONFeed from "medium-json-feed";

import { getAllReleases } from "./github";

export async function fetchNewsFeedData(): Promise<NewsItem[]> {
  const mediumNews = fetchMediumNews();
  const githubNews = fetchGithubReleaseNews(["Ishiiruka", "slippi-launcher", "dolphin"]);
  const allNews = (await Promise.all([mediumNews, githubNews])).flat();
  return allNews.sort((a, b) => {
    // Sort all news item by reverse chronological order
    const aDate = new Date(a.publishedAt).getTime();
    const bDate = new Date(b.publishedAt).getTime();
    return bDate - aDate;
  });
}

async function fetchMediumNews(): Promise<NewsItem[]> {
  return mediumJSONFeed("project-slippi").then(
    (feedFetchAttempt: { status: number; response: any }) => {
      if (feedFetchAttempt?.status !== 200) {
        // NOTE(VirtualFreeEx): I do not think that this is a possible
        // occurance, as the promise is exclusively resolved with 200
        // in the original library.
        throw new Error("Received a non-200 response.");
      }

      const result = feedFetchAttempt.response;
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
    },
    (error: any) => {
      log.warn("Failed to fetch Medium news!", error);
      // HACK(VirtualFreeEx): Returning a news post instead of showing a warning snackbar.
      // Ideally, this should be either silently failing or display a better indicator of failure (such as a snackbar.)
      return [
        {
          id: "fallback-medium-load-failed",
          title: "Failed loading Medium news!",
          body: "An error has occured while trying to fetch news from Medium. See logs for more details, join Project Slippi Discord server for support.",
          publishedAt: new Date().toISOString(),
          permalink: socials.discordUrl,
        },
      ];
    },
  );
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
