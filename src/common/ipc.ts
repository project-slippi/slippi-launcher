import { _, EmptyPayload, makeEndpoint } from "../ipc";
import { BroadcasterItem, NewsItem } from "./types";

export const fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);

export const fetchBroadcastList = makeEndpoint.main(
  "fetchBroadcastList",
  <{ authToken: string }>_,
  <BroadcasterItem[]>_,
);
