import { TimeExpiryCache } from "@common/time_expiry_cache";

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

type BlueskyPostRef = {
  uri: string;
  cid: string;
};

export type BlueskyPostView = {
  uri: string;
  cid: string;
  author: BlueskyUser;
  record: {
    createdAt: string;
    text: string;
    reply?: {
      root: BlueskyPostRef;
      parent: BlueskyPostRef;
    };
  };
  replyCount: number;
  repostCount: number;
  likeCount: number;
  quoteCount: number;
  indexedAt: string;
  labels: string[];
};

export type BlueskyPost = {
  post: BlueskyPostView;
  reply?: any;
  reason:
    | {
        by: BlueskyUser;
        indexedAt: string;
      }
    | undefined;
};

export type BlueskyThread = {
  post: BlueskyPostView;
  // The author's own replies continuing the thread, oldest first
  replies: BlueskyPostView[];
};

type BlueskyFeed = {
  feed: BlueskyPost[] | undefined;
  error?: string;
  message?: string;
};

// Let's cache our Bluesky responses to prevent hitting the API too much
const cache = new TimeExpiryCache<string, BlueskyFeed>(EXPIRES_IN);

export async function getBlueskyFeed(actorId: string): Promise<BlueskyThread[]> {
  const url = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed");
  url.searchParams.append("actor", actorId);

  const data = await cachedFetch(url.toString());

  if (data.error || data.feed == null) {
    throw new Error(`Error fetching Bluesky feed: ${data.message}`);
  }

  return groupSelfThreads(data.feed);
}

/**
 * Returns the top level posts of the feed, each with the chain of replies the author made to their own post.
 * Replies to other users, and anything chained off of those, are left out.
 *
 * Since the feed is newest first and replies are always newer than the post they reply to, every
 * self-reply of a top level post in the feed is guaranteed to also be in the feed.
 */
export function groupSelfThreads(feed: BlueskyPost[]): BlueskyThread[] {
  const repliesByParentUri = new Map<string, BlueskyPostView[]>();
  feed.forEach(({ post, reason }) => {
    const parentUri = post.record.reply?.parent.uri;
    // Ignore reposts so a reposted reply doesn't get counted as part of a thread
    if (parentUri && !reason) {
      repliesByParentUri.set(parentUri, [...(repliesByParentUri.get(parentUri) ?? []), post]);
    }
  });

  // any api response with the reply field is not a top level post and we don't want to show those in the launcher
  return feed
    .filter((entry) => !entry.reply)
    .map(({ post }): BlueskyThread => {
      const replies: BlueskyPostView[] = [];
      let current = post;
      for (;;) {
        // If the author replied to the same post more than once, follow the earliest reply
        const next = (repliesByParentUri.get(current.uri) ?? [])
          .filter((reply) => reply.author.did === post.author.did)
          .sort((a, b) => new Date(a.record.createdAt).getTime() - new Date(b.record.createdAt).getTime())[0];
        if (!next) {
          break;
        }
        replies.push(next);
        current = next;
      }
      return { post, replies };
    });
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
