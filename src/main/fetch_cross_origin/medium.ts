import { fetch } from "cross-fetch";
import electronLog from "electron-log";

const log = electronLog.scope("main/medium");

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const EXPIRES_IN = 10 * MINUTE;

export type MediumPost = {
  title: string;
  /** The Medium pubDate string formatted as: "YYYY-MM-DD HH:MM:SS" */
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  enclosure: Record<string, unknown>;
  categories: string[];
};

export type MediumFeed = {
  status: string | undefined;
  items: MediumPost[] | undefined;
};

// Let's cache our Medium responses to prevent hitting the API too much
type ResponseCacheEntry = {
  time: number;
  response: MediumFeed;
};

const mediumResponseCache: Record<string, ResponseCacheEntry> = {};

export async function getMediumFeed(profileName: string): Promise<MediumFeed> {
  const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/${profileName}`;

  try {
    const data = await cachedFetch(rssUrl);
    return data;
  } catch (error) {
    log.error("Error fetching Medium feed:", error);
    return {
      status: "error",
      items: undefined,
    };
  }
}

async function cachedFetch(rssUrl: string): Promise<MediumFeed> {
  log.debug(`Checking cache for: ${rssUrl}`);

  const cachedResponse = mediumResponseCache[rssUrl];
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

  log.debug(`Fetching: ${rssUrl}`);

  const rssRes = await fetch(rssUrl);
  const rssJson = await rssRes.json();

  // Check to make sure rss result is ok
  if (rssJson.status !== "ok" || !rssJson.items) {
    throw new Error(rssJson.message || "Error fetching Medium RSS feed");
  }

  // Return raw RSS items as MediumPost array
  const items: MediumPost[] = rssJson.items;

  const data: MediumFeed = {
    status: "ok",
    items,
  };

  // Cache the data
  mediumResponseCache[rssUrl] = {
    response: data,
    time: Date.now(),
  };

  return data;
}
