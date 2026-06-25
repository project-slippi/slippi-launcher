import log from "electron-log";
import { getReleases } from "main/fetch_cross_origin/github";

import type { BaseNewsItem, NewsSource } from "../types";

export class GithubNewsSource implements NewsSource {
  readonly id = "github" as const;

  private readonly repos = ["Ishiiruka", "slippi-launcher", "dolphin"] as const;

  async fetch(): Promise<readonly BaseNewsItem[]> {
    const start = Date.now();
    log.info(`Fetching Github releases for ${this.repos.join(", ")}...`);
    const allReleases = await Promise.allSettled(
      this.repos.map(async (repo) => {
        const releases = await getReleases("project-slippi", repo);
        return releases.map((release): BaseNewsItem => {
          return {
            id: `gh-${repo}-${release.id}`,
            title: `[${repo}] ${release.name}`,
            body: release.body,
            publishedAt: new Date(release.published_at),
            permalink: release.html_url,
          };
        });
      }),
    );

    log.info(`Github releases fetched in ${Date.now() - start}ms`);

    return allReleases.flatMap((promise): BaseNewsItem[] => {
      if (promise.status === "fulfilled") {
        return promise.value;
      }

      log.error(promise.reason);
      return [];
    });
  }
}
