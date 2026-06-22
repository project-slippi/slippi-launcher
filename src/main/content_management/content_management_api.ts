import { ipc_contentManagementService } from "../ipc";
import type { ContentManagementParams, ContentManagementResult, ContentManagementServiceName } from "./registry";

async function callService<N extends ContentManagementServiceName>(
  service: N,
  params: ContentManagementParams<N>,
): Promise<ContentManagementResult<N>> {
  const { result } = await ipc_contentManagementService.renderer!.trigger({
    service,
    params,
  });
  return result.data as ContentManagementResult<N>;
}

export const contentManagementApi = {
  fetchCurrentLocation: (lang?: string) => callService("fetchCurrentLocation", { lang }),
  fetchNearestTournaments: (location: { lat: number; lng: number }, radiusKms?: number) =>
    callService("fetchNearestTournaments", { location, radiusKms }),
  fetchUpcomingMeleeMajors: () => callService("fetchUpcomingMeleeMajors", {}),
  fetchNewsFeed: () => callService("fetchNewsFeed", {}),
};

export type ContentManagementService = typeof contentManagementApi;
