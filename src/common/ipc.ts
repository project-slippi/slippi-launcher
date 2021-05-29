import { _, EmptyPayload, makeEndpoint } from "../ipc";
import { NewsItem } from "./types";

export const fetchNewsFeed = makeEndpoint.main("fetchNewsFeed", <EmptyPayload>_, <NewsItem[]>_);

export const checkValidIso = makeEndpoint.main("checkValidIso", <{ path: string }>_, <{ valid: boolean }>_);
