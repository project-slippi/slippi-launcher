import { fetch } from "cross-fetch";
import electronLog from "electron-log";

const log = electronLog.scope("main/bluesky");

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const EXPIRES_IN = 10 * MINUTE;

export type BlueskyUser = {
  did: string;
  handle: string;
  displayName: string;
  avatar: string;
  labels: string[];
  createdAt: string;
};

export type BlueskyPost = {
  post: {
    uri: string;
    cid: string;
    author: BlueskyUser;
    record: {
      createdAt: string;
      text: string;
    };
    replyCount: number;
    repostCount: number;
    likeCount: number;
    quoteCount: number;
    indexedAt: string;
    labels: string[];
  };
  reason:
    | {
        by: BlueskyUser;
        indexedAt: string;
      }
    | undefined;
};

export type BlueskyFeed = {
  feed: BlueskyPost[] | undefined;
  error: string | undefined;
  message: string | undefined;
};

// Let's cache our Bluesky responses to prevent hitting the API too much
type ResponseCacheEntry = {
  time: number;
  response: any;
};

const blueskyResponseCache: Record<string, ResponseCacheEntry> = {};

export async function getBlueskyFeed(): Promise<BlueskyFeed> {
  const url = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed");
  url.searchParams.append("actor", "did:plc:6xwud4csg7p7243ptrc5sa5y");

  const data = await cachedFetch(url.toString());

  return data;
}

async function cachedFetch(url: string): Promise<any> {
  log.debug(`Checking cache for: ${url}`);
  const cachedResponse = blueskyResponseCache[url];
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
  blueskyResponseCache[url] = {
    response: data,
    time: Date.now(),
  };

  return data;
}
