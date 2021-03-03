import { fetch } from "cross-fetch";
import log from "electron-log";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const EXPIRES_IN = 10 * MINUTE;

// Let's cache our Github responses so we don't exceed the 60 requests/hour rate limit
interface ResponseCacheEntry {
  time: number;
  response: any;
}

const githubResponseCache: Record<string, ResponseCacheEntry> = {};

export async function getLatestRelease(owner: string, repo: string): Promise<any> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const data = await cachedFetch(url);
  return data;
}

export async function getAllReleases(owner: string, repo: string): Promise<any> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const data = await cachedFetch(url);
  return data;
}

async function cachedFetch(url: string): Promise<any> {
  log.debug(`Fetching: ${url}`);
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
