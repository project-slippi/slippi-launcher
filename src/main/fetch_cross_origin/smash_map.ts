import { Preconditions } from "@common/preconditions";
import { TimeExpiryCache } from "@common/time_expiry_cache";
import electronLog from "electron-log";

const log = electronLog.scope("smash_map");

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
  // Events without an uploaded profile image have a null image
  image: Image | null;
  is_online: number;
  name: string;
  iso_start_date_time: string;
  iso_end_date_time: string;
  timezone_start_date_time: string;
  timezone_end_date_time: string;
  timezone: string;
  /** Number of attendees at the event, returns null if unknown */
  attendees: number | null;
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

// The SmashMap API does not actually have a limit but we'll impose a max radius here
const MAX_RADIUS = 1000;
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
  imageSrc?: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  url: string;
  location: {
    lat: number;
    lng: number;
  };
  /** Distance from the search location to the event venue in km */
  distanceToVenueKm: number;
  /** Number of attendees at the event, if known */
  attendees?: number;
};

export async function fetchNearestTournaments(
  location: { lat: number; lng: number },
  radiusKms: number = 100,
): Promise<SmashMapEvent[]> {
  const { lat, lng } = location;
  Preconditions.checkState(isValidLatLng(lat, lng), `Invalid lat/long: ${lat},${lng}`);

  const clampedRadiusKms = Math.min(Math.max(Math.round(radiusKms), MIN_RADIUS), MAX_RADIUS);

  const url = `https://smash-map.com/api/events?lat=${lat}&lng=${lng}&radius=${clampedRadiusKms}&games=1&paginate=false`;
  let response: SmashMapEventsResponse | undefined = smashMapResponseCache.get(url);
  if (!response) {
    // Fetch the data
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch SmashMap events: HTTP ${res.status} ${res.statusText}`);
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new Error("Failed to parse SmashMap events response");
    }

    Preconditions.checkState(isSmashMapEventsResponse(data), "Invalid SmashMap events response");
    response = data;

    // Cache the data only after we know it has the expected shape
    smashMapResponseCache.set(url, response);
  }

  const now = Date.now();
  return (
    response.data
      .map((event) => safeMapSmashMapEventResponse(event, { lat, lng }))
      // Drop any events we could not map instead of failing the entire list
      .filter((event): event is SmashMapEvent => event !== null && event.endDate.getTime() > now)
  );
}

function safeMapSmashMapEventResponse(
  event: SmashMapEventResponse,
  searchLocation: { lat: number; lng: number },
): SmashMapEvent | null {
  try {
    return mapSmashMapEventResponseToSmashMapEvent(event, searchLocation);
  } catch (error) {
    log.warn(`Failed to map SmashMap event: ${event?.name} (${event?.id})`, error);
    return null;
  }
}

function mapSmashMapEventResponseToSmashMapEvent(
  event: SmashMapEventResponse,
  searchLocation: { lat: number; lng: number },
): SmashMapEvent | null {
  const startDate = new Date(event.iso_start_date_time);
  const endDate = new Date(event.iso_end_date_time);
  const address = event.address;
  const timezone = address?.country?.timezone;

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    !isValidTimeZone(timezone) ||
    !address ||
    !isValidLatLng(address.latitude, address.longitude)
  ) {
    log.warn(`Skipping invalid SmashMap event: ${event.name} (${event.id})`, event);
    return null;
  }

  return {
    name: event.name,
    // Events are allowed to have no image
    imageSrc: event.image?.url,
    startDate,
    endDate,
    timezone,
    url: event.link,
    location: {
      lat: address.latitude,
      lng: address.longitude,
    },
    distanceToVenueKm: haversineDistanceKm(address.latitude, address.longitude, searchLocation.lat, searchLocation.lng),
    attendees: event.attendees ?? undefined,
  };
}

function isSmashMapEventsResponse(value: unknown): value is SmashMapEventsResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return Array.isArray((value as { data?: unknown }).data);
}

function isValidTimeZone(timezone: string | null | undefined): timezone is string {
  if (!timezone) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  return R * c;
}
