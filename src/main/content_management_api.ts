import type {
  ContentManagementParams,
  ContentManagementResult,
  ContentManagementServiceName,
} from "./content_management/registry";
import { ipc_contentManagementService } from "./ipc";

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

const contentManagementApi = {
  fetchCurrentLocation: (lang?: string) => callService("fetchCurrentLocation", { lang }),
  fetchNearestTournaments: (location: { lat: number; lng: number }, radiusKms?: number) =>
    callService("fetchNearestTournaments", { location, radiusKms }),
  fetchUpcomingMeleeMajors: () => callService("fetchUpcomingMeleeMajors", {}),
};

export default contentManagementApi;
