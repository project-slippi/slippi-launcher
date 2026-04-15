import { Preconditions } from "@common/preconditions";
import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const EXPIRES_IN_MS = 24 * HOUR;

type SmashMapEventsResponse = {
  data: SmashMapEventResponse[];
};

type SmashMapEventResponse = {
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
const smashMapResponseCache = new TimeExpiryCache<string, SmashMapEventsResponse>(EXPIRES_IN_MS);

const MAX_RADIUS = 200;
const MIN_RADIUS = 1;

function isValidLatitude(lat: number) {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lng: number) {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
function isValidLatLng(lat: number, lng: number) {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

export type SmashMapEvent = {
  name: string;
  imageSrc: string;
  startDate: Date;
  endDate: Date;
  url: string;
  location: {
    lat: number;
    lng: number;
  };
};

export async function fetchNearestTournaments(
  location: { lat: number; lng: number },
  radiusKms: number = 100,
): Promise<SmashMapEvent[]> {
  const { lat, lng } = location;
  Preconditions.checkState(isValidLatLng(lat, lng), `Invalid lat/long: ${lat},${lng}`);

  const clampedRadiusKms = Math.min(Math.max(Math.round(radiusKms), MIN_RADIUS), MAX_RADIUS);

  const url = `https://smash-map.com/api/events?lat=${lat}&lng=${lng}&radius=${clampedRadiusKms}&games=1&paginate=false`;
  const cachedResponse = smashMapResponseCache.get(url);
  if (cachedResponse) {
    return cachedResponse.data.map(mapSmashMapEventResponseToSmashMapEvent);
  }

  // Fetch the data
  const res = await fetch(url);
  const data = (await res.json()) as SmashMapEventsResponse;

  // Cache the data
  smashMapResponseCache.set(url, data);

  return data.data.map(mapSmashMapEventResponseToSmashMapEvent);
}

function parseApiDate(dateStr: string, timezone: string): Date {
  // "04-05-2026 10:00:00"
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("-").map(Number);

  // "UTC +09:00" -> "+09:00"
  const offset = timezone.replace("UTC", "").trim();

  // Build ISO string
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${timePart}${offset}`;

  return new Date(iso);
}

function mapSmashMapEventResponseToSmashMapEvent(event: SmashMapEventResponse): SmashMapEvent {
  return {
    name: event.name,
    imageSrc: event.image.url,
    startDate: parseApiDate(event.timezone_start_date_time, event.timezone),
    endDate: parseApiDate(event.timezone_end_date_time, event.timezone),
    url: event.link,
    location: {
      lat: event.address.latitude,
      lng: event.address.longitude,
    },
  };
}
