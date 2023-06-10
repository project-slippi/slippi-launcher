import { fetch } from "cross-fetch";
import electronLog from "electron-log";

const log = electronLog.scope("main/github");

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const EXPIRES_IN = 10 * MINUTE;

// Let's cache our Github responses so we don't exceed the 60 requests/hour rate limit
type ResponseCacheEntry = {
  time: number;
  response: any;
};

const githubResponseCache: Record<string, ResponseCacheEntry> = {};

export async function getLatestRelease(owner: string, repo: string): Promise<any> {
  // We can re-use api calls by returning the first item in all releases
  // since it already returns the newest release first.
  const data = await getAllReleases(owner, repo);
  if (data.length > 0) {
    return data[0];
  }
  throw new Error(`No releases found for ${owner}/${repo}`);
}

export async function getAllReleases(owner: string, repo: string): Promise<any> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const data = await cachedFetch(url);
  return data;
}

async function cachedFetch(url: string): Promise<any> {
  log.debug(`Checking cache for: ${url}`);
  const cachedResponse = githubResponseCache[url];
  if (cachedResponse) {
    // Check if the cache has expired
    const elapsedMs = Date.now() - cachedResponse.time;
    if (elapsedMs <= EXPIRES_IN) {
      log.debug(`Cache hit. Returning cached response.`);
      return cachedResponse.response;
    } else {
      log.debug(`Cache expired. Refetching data...`);
    }
  }

  log.debug(`Fetching: ${url}`);
  // Fetch the data
  const res = await fetch(url);
  const data = await res.json();

  // Cache the data
  githubResponseCache[url] = {
    response: data,
    time: Date.now(),
  };

  return data;
}
