import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const EXPIRES_IN = 10 * MINUTE;

export type GithubReleaseInfo = {
  id: number;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  tag_name: string;
};

// Let's cache our Github responses so we don't exceed the 60 requests/hour rate limit
const githubResponseCache = new TimeExpiryCache<string, any>(EXPIRES_IN);

export async function getLatestRelease(owner: string, repo: string): Promise<GithubReleaseInfo> {
  // We can re-use api calls by returning the first item in all releases
  // since it already returns the newest release first.
  const data = await getAllReleases(owner, repo);
  if (data.length > 0) {
    return data[0];
  }
  throw new Error(`No releases found for ${owner}/${repo}`);
}

export async function getAllReleases(owner: string, repo: string): Promise<GithubReleaseInfo[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const data = await cachedFetch(url);
  return data;
}

async function cachedFetch(url: string): Promise<any> {
  let response = githubResponseCache.get(url);
  if (!response) {
    // Fetch the data
    const res = await fetch(url);
    response = await res.json();
    githubResponseCache.set(url, response);
  }

  return response;
}
