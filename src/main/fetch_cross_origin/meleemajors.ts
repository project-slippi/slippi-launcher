import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const EXPIRES_IN_MS = 24 * HOUR;

const API_URL = "https://meleemajors.gg/api/v1/tournaments.json";

type MeleeMajorResponse = {
  lastUpdated: string;
  tournaments: MeleeMajorTournamentResponse[];
};

type MeleeMajorTournamentResponse = {
  "city-and-state": string;
  "date-string": string; // Human readable date string e.g. April 10 - April 12
  entrants: string;
  "full-address": string;
  "image-url": string;
  "maps-link": string;
  name: string;
  players: string[];
  "schedule-url": string;
  "start-timestamp": string;
  "start.gg-tournament-name": string;
  "start.gg-url": string;
  "stream-url": string;
  timezone: string;
  "top8-start-time": string;
};

// Let's cache our responses to avoid hammering the backend
const cache = new TimeExpiryCache<string, MeleeMajorResponse>(EXPIRES_IN_MS);

export type MeleeMajorTournamentEvent = {
  cityAndState: string;
  dateString: string;
  entrants: number;
  fullAddress: string;
  imageUrl: string;
  mapsLink: string;
  name: string;
  players: string[];
  scheduleUrl: string;
  startTimestamp: Date;
  startggTournamentName: string;
  startggUrl: string;
  streamUrl: string;
  timezone: string;
  top8StartTime: string;
};

export async function fetchUpcomingMeleeMajors(): Promise<MeleeMajorTournamentEvent[]> {
  let responseData: MeleeMajorResponse | undefined = cache.get(API_URL);
  if (!responseData) {
    // Fetch the data
    const res = await fetch(API_URL);
    responseData = (await res.json()) as MeleeMajorResponse;

    // Cache the data
    cache.set(API_URL, responseData);
  }

  return responseData.tournaments.map(mapMeleeMajorEventResponseToMeleeMajorEvent);
}

function mapMeleeMajorEventResponseToMeleeMajorEvent(event: MeleeMajorTournamentResponse): MeleeMajorTournamentEvent {
  return {
    cityAndState: event["city-and-state"],
    dateString: event["date-string"],
    entrants: Number.parseInt(event.entrants, 10),
    fullAddress: event["full-address"],
    imageUrl: event["image-url"],
    mapsLink: event["maps-link"],
    name: event.name,
    players: event.players,
    scheduleUrl: event["schedule-url"],
    startTimestamp: new Date(event["start-timestamp"]),
    startggTournamentName: event["start.gg-tournament-name"],
    startggUrl: event["start.gg-url"],
    streamUrl: event["stream-url"],
    timezone: event["timezone"],
    top8StartTime: event["top8-start-time"],
  };
}
