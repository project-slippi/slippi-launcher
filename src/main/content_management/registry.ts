import type { UserLocationInfo } from "../fetch_cross_origin/ip_api";
import type { MeleeMajorsTournament } from "../fetch_cross_origin/melee_majors";
import type { SmashMapEvent } from "../fetch_cross_origin/smash_map";

export interface ContentManagementServiceDefinition {
  fetchCurrentLocation: {
    params: { lang?: string };
    result: UserLocationInfo;
  };
  fetchNearestTournaments: {
    params: { location: { lat: number; lng: number }; radiusKms?: number };
    result: SmashMapEvent[];
  };
  fetchUpcomingMeleeMajors: {
    params: Record<string, never>;
    result: MeleeMajorsTournament[];
  };
}

export type ContentManagementServiceName = keyof ContentManagementServiceDefinition;

export type ContentManagementParams<N extends ContentManagementServiceName> =
  ContentManagementServiceDefinition[N]["params"];

export type ContentManagementResult<N extends ContentManagementServiceName> =
  ContentManagementServiceDefinition[N]["result"];
