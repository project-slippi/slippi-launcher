import { _, EmptyPayload, makeEndpoint } from "../ipc";
import { NewsItem } from "./types";

export const fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);
