import { fetchCurrentLocation } from "../fetch_cross_origin/ip_api";
import { fetchUpcomingMeleeMajors } from "../fetch_cross_origin/melee_majors";
import { fetchNearestTournaments } from "../fetch_cross_origin/smash_map";
import { fetchNewsFeedData } from "./news_feed/news_feed";
import type { ContentManagementParams, ContentManagementServiceName } from "./registry";

type HandlerMap = {
  [N in ContentManagementServiceName]: (params: unknown) => Promise<unknown>;
};

const handlers: HandlerMap = {
  fetchCurrentLocation: (params) => {
    const { lang } = params as ContentManagementParams<"fetchCurrentLocation">;
    return fetchCurrentLocation(lang);
  },
  fetchNearestTournaments: (params) => {
    const { location, radiusKms } = params as ContentManagementParams<"fetchNearestTournaments">;
    return fetchNearestTournaments(location, radiusKms);
  },
  fetchUpcomingMeleeMajors: () => fetchUpcomingMeleeMajors(),
  fetchNewsFeed: () => fetchNewsFeedData(),
};

export async function dispatchContentManagementService(
  service: ContentManagementServiceName,
  params: unknown,
): Promise<unknown> {
  const handler = handlers[service];
  if (!handler) {
    throw new Error(`Unknown content management service: ${service}`);
  }
  return handler(params);
}
