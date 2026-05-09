import { Preconditions } from "@common/preconditions";
import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

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
  items: MediumPost[];
};

// Let's cache our Medium responses to prevent hitting the API too much
const cache = new TimeExpiryCache<string, MediumFeed>(EXPIRES_IN);

export async function getMediumFeed(profileName: string): Promise<MediumFeed> {
  const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/${profileName}`;
  return cachedFetch(rssUrl);
}

async function cachedFetch(rssUrl: string): Promise<MediumFeed> {
  let response = cache.get(rssUrl);
  if (!response) {
    const rssRes = await fetch(rssUrl);
    response = (await rssRes.json()) as MediumFeed;
    cache.set(rssUrl, response);
  }

  // Ensure the response is ok
  Preconditions.checkState(response.status === "ok", "Error fetching Medium RSS feed");
  return response;
}
