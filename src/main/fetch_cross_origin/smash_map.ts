import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const EXPIRES_IN_MS = 24 * HOUR;

type SmashMapEventsResponse = {
  data: SmashMapEvent[];
};

export type SmashMapEvent = {
  id: number;
  game: Game;
  address: Address;
  image: Image;
  is_online: boolean;
  name: string;
  timezone_start_date_time: string; // ISO string
  timezone_end_date_time: string; // ISO string
  timezone: string;
  attendees: number;
  link: string;
  user_subscribed: boolean;
};

type Game = {
  name: string;
  color: string; // hex color
};

type Address = {
  country: Country;
  name: string;
  latitude: number;
  longitude: number;
};

type Country = {
  name: string;
  timezone: string;
};

type Image = {
  url: string;
};

// Let's cache our responses to avoid hammering the backend
const smashMapResponseCache = new TimeExpiryCache<string, SmashMapEvent[]>(EXPIRES_IN_MS);
const ipApiResponseCache = new TimeExpiryCache<string, IpApiResponse>(EXPIRES_IN_MS);

const MAX_RADIUS = 200;
const MIN_RADIUS = 1;

// function isValidLatitude(lat: number) {
//   return Number.isFinite(lat) && lat >= -90 && lat <= 90;
// }

// function isValidLongitude(lng: number) {
//   return Number.isFinite(lng) && lng >= -180 && lng <= 180;
// }
// function isValidLatLng(lat: number, lng: number) {
//   return isValidLatitude(lat) && isValidLongitude(lng);
// }

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

async function fetchCurrentLocation(): Promise<IpApiResponse> {
  const cachedResponse = ipApiResponseCache.get(API);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch the data
  const res = await fetch(API);
  const data = (await res.json()) as IpApiResponse;

  // Cache the data
  ipApiResponseCache.set(API, data);

  return data;
}

export async function fetchNearestTournaments(
  // location: { lat: number; lng: number },
  radiusKms: number = 100,
): Promise<SmashMapEvent[]> {
  // const { lat, lng } = location;
  // Preconditions.checkState(isValidLatLng(lat, lng), `Invalid lat/long: ${lat},${lng}`);
  const { lat, lon } = await fetchCurrentLocation();

  const clampedRadiusKms = Math.min(Math.max(Math.round(radiusKms), MIN_RADIUS), MAX_RADIUS);

  const url = `https://smash-map.com/api/events?lat=${lat}&lng=${lon}&radius=${clampedRadiusKms}&games=1&paginate=false`;
  const cachedResponse = smashMapResponseCache.get(url);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch the data
  const res = await fetch(url);
  const data = (await res.json()) as SmashMapEventsResponse;

  // Cache the data
  smashMapResponseCache.set(url, data.data);

  return data.data;
}
