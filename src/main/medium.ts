import { fetch } from "cross-fetch";
import electronLog from "electron-log";

const log = electronLog.scope("main/medium");

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const EXPIRES_IN = 10 * MINUTE;

export type MediumPost = {
  id: string;
  previewImage: {
    id: string;
  };
  title: string;
  extendedPreviewContent: {
    subtitle: string;
  };
  mediumUrl: string;
  latestPublishedAt: number; // Unix timestamp in milliseconds
};

export type MediumFeed = {
  status: string | undefined;
  items: MediumPost[] | undefined;
};

// Let's cache our Medium responses to prevent hitting the API too much
type ResponseCacheEntry = {
  time: number;
  response: any;
};

const mediumPostQuery = `
  query PublicationSectionPostsQuery($postIds: [ID!]!) {
    postResults(postIds: $postIds) {
      ... on Post {
        id
        previewImage {
          id
        }
        title
        extendedPreviewContent {
          subtitle
        }
        mediumUrl
        latestPublishedAt
      }
    }
  }`;

const mediumResponseCache: Record<string, ResponseCacheEntry> = {};

export async function getMediumFeed(): Promise<MediumFeed> {
  const rssUrl = new URL("https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/project-slippi");
  const gqlUrl = new URL("https://medium.com/_/graphql");
  let data: MediumFeed = { status: undefined, items: undefined };
  try {
    data = await cachedFetch(rssUrl.toString(), gqlUrl.toString());
  } catch (error) {
    console.log("Error fetching Medium feed:", error);
    return {
      status: "error",
      items: undefined,
    };
  }

  return data;
}

async function cachedFetch(rssUrl: string, gqlUrl: string): Promise<any> {
  log.debug(`Checking cache for: ${rssUrl}`);
  // It's kind of pointless to key this cache on string considering we always fetch the same URL
  const cachedResponse = mediumResponseCache[`${rssUrl}-${gqlUrl}`];
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
  // Fetch the data
  const rssRes = await fetch(rssUrl);
  const rssJson = await rssRes.json();

  // Check to make sure rss result is ok
  if (rssJson.status !== "ok" || rssJson.items === undefined) {
    throw new Error(rssJson.message || "Error fetching Medium RSS feed");
  }

  // Get post IDs from RSS feed
  const postIds = rssJson.items.map((item: any) => item.guid.split("/").pop());

  // Fire off a post request to the Medium GraphQL endpoint to get post details
  log.debug(`Fetching: ${gqlUrl}`);
  const gqlRes = await fetch(gqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Origin: "https://medium.com",
      Referer: "https://medium.com/",
    },
    body: JSON.stringify({
      query: mediumPostQuery,
      variables: {
        postIds,
      },
    }),
  });
  console.log(gqlRes); // The .json call below fails because we get a 403 forbidden from Medium
  const gqlJson = await gqlRes.json();

  console.log("Results:");
  console.log(gqlJson);

  const data = {};

  // Cache the data
  mediumResponseCache[`${rssUrl}-${gqlUrl}`] = {
    response: data,
    time: Date.now(),
  };

  return data;
}
