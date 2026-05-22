import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

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
  reply?: any;
  reason:
    | {
        by: BlueskyUser;
        indexedAt: string;
      }
    | undefined;
};

type BlueskyFeed = {
  feed: BlueskyPost[] | undefined;
  error?: string;
  message?: string;
};

// Let's cache our Bluesky responses to prevent hitting the API too much
const cache = new TimeExpiryCache<string, BlueskyFeed>(EXPIRES_IN);

export async function getBlueskyFeed(actorId: string): Promise<BlueskyPost[]> {
  const url = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed");
  url.searchParams.append("actor", actorId);

  const data = await cachedFetch(url.toString());

  if (data.error || data.feed == null) {
    throw new Error(`Error fetching Bluesky feed: ${data.message}`);
  }

  return (
    // any api response with the reply field is not a top level post and we don't want to show those in the launcher
    data.feed.filter((entry) => !entry.reply)
  );
}

async function cachedFetch(url: string): Promise<BlueskyFeed> {
  let response: BlueskyFeed | undefined = cache.get(url);
  if (!response) {
    // Fetch the data
    const res = await fetch(url);
    response = (await res.json()) as BlueskyFeed;

    cache.set(url, response);
  }

  return response;
}
