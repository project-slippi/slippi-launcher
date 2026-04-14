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
  is_online: number;
  name: string;
  iso_start_date_time: string;
  iso_end_date_time: string;
  timezone_start_date_time: string;
  timezone_end_date_time: string;
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
  imageSrc: string;
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
  /** Number of attendees at the event */
  attendees: number;
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
    response = (await res.json()) as SmashMapEventsResponse;

    // Cache the data
    smashMapResponseCache.set(url, response);
  }

  const now = Date.now();
  return response.data
    .map((event) => mapSmashMapEventResponseToSmashMapEvent(event, { lat, lng }))
    .filter((event) => event.endDate.getTime() > now);
}

function mapSmashMapEventResponseToSmashMapEvent(
  event: SmashMapEventResponse,
  searchLocation: { lat: number; lng: number },
): SmashMapEvent {
  return {
    name: event.name,
    imageSrc: event.image.url,
    startDate: new Date(event.iso_start_date_time),
    endDate: new Date(event.iso_end_date_time),
    timezone: event.address.country.timezone,
    url: event.link,
    location: {
      lat: event.address.latitude,
      lng: event.address.longitude,
    },
    distanceToVenueKm: haversineDistanceKm(
      event.address.latitude,
      event.address.longitude,
      searchLocation.lat,
      searchLocation.lng,
    ),
    attendees: event.attendees,
  };
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
