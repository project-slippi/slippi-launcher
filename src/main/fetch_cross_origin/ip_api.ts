import { Preconditions } from "@common/preconditions";
import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const EXPIRES_IN_MS = 1 * HOUR;

// Let's cache our responses to avoid hammering the backend
const cache = new TimeExpiryCache<string, IpApiResponse>(EXPIRES_IN_MS);

// Note that this only supports HTTP only for free
// Rate limit is 45 requests per minute
// We're gonna cache it for an hour so we don't hit the rate limit
const API = "http://ip-api.com/json";

type IpApiResponse = {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
};

export type UserLocationInfo = Pick<IpApiResponse, "lat" | "lon" | "country" | "countryCode" | "city" | "regionName">;

export async function fetchCurrentLocation(): Promise<UserLocationInfo> {
  const cachedResponse = cache.get(API);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch the data
  const res = await fetch(API);
  const data = (await res.json()) as IpApiResponse;
  Preconditions.checkState(data.status === "success", `Failed to fetch current location: ${data.status}`);

  // Cache the data
  cache.set(API, data);

  return data;
}
