import { exists } from "@common/exists";
import { TimeExpiryCache } from "@common/time_expiry_cache";
import { fetch } from "cross-fetch";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const EXPIRES_IN_MS = 24 * HOUR;

const API_URL = "https://meleemajors.gg/api/v1/tournaments.json";

// Top-level response
type MeleeMajorsTournamentsResponse = {
  /**
   * Reference to the JSON Schema this payload conforms to.
   * Present so editors and validators can auto-discover the schema.
   */
  $schema?: string;

  /**
   * RFC 3339 timestamp of when this payload was generated.
   */
  lastUpdated: string;

  /**
   * All tracked tournaments, ordered chronologically by start date (soonest first).
   */
  tournaments: Tournament[];
};

// Tournament object
type Tournament = {
  /**
   * Human-readable tournament name as displayed on the site.
   */
  name: string;

  /**
   * Internal slug-like identifier derived from the tournament's start.gg URL.
   * Stable across builds and safe to use as a key.
   */
  startggTournamentName: string;

  /**
   * RFC 3339 timestamp for when the tournament begins.
   */
  startTimestamp: string;

  /**
   * RFC 3339 timestamp for when the tournament ends.
   */
  endTimestamp: string;

  /**
   * Pre-formatted human-readable date range intended for display.
   * Not machine-parseable; use startTimestamp for programmatic handling.
   */
  dateString: string;

  /**
   * IANA timezone name for the tournament venue.
   */
  timezone: string;

  /**
   * Announced start time of Top 8, in the organizer's preferred format.
   * Null if not yet scheduled.
   */
  top8StartTime: string | null;

  /**
   * Total registered entrants in the main singles bracket.
   * Null if unknown or registration not open.
   */
  entrants: number | null;

  /**
   * Fixed-length list of the top 8 seeded/notable entrants, ordered by seed.
   * Slots that have not yet been announced are null.
   */
  players: readonly (string | null)[];

  /**
   * Short locality string for display (city + state/region).
   */
  cityAndState: string;

  /**
   * Full postal address of the venue.
   */
  fullAddress: string;

  /**
   * Google Maps search URL for the venue address.
   */
  mapsLink: string;

  /**
   * Canonical start.gg URL for the main Melee singles event page.
   */
  startggUrl: string;

  /**
   * start.gg URL for the tournament's overview/details page.
   * Null if it cannot be derived.
   */
  startggDetailsUrl: string | null;

  /**
   * Primary livestream URL (typically Twitch or YouTube).
   * Null if not announced.
   */
  streamUrl: string | null;

  /**
   * URL to the published event schedule.
   * Null if unavailable.
   */
  scheduleUrl: string | null;

  /**
   * Absolute URL to the tournament's promotional banner image.
   */
  imageUrl: string;

  /**
   * Absolute URL to the tournament's square thumbnail/profile image.
   * Null if unavailable.
   */
  thumbnailUrl: string | null;
};

// Let's cache our responses to avoid hammering the backend
const cache = new TimeExpiryCache<string, MeleeMajorsTournamentsResponse>(EXPIRES_IN_MS);

export async function fetchUpcomingMeleeMajors(): Promise<MeleeMajorsTournament[]> {
  let responseData: MeleeMajorsTournamentsResponse | undefined = cache.get(API_URL);
  if (!responseData) {
    // Fetch the data
    const res = await fetch(API_URL);
    responseData = (await res.json()) as MeleeMajorsTournamentsResponse;

    // Cache the data
    cache.set(API_URL, responseData);
  }

  const now = Date.now();
  return (
    responseData.tournaments
      .map(mapMeleeMajorsTournament)
      // Filter out the tournaments that are already over
      .filter((tournament) => tournament.endTimestamp.getTime() > now)
  );
}

export type MeleeMajorsTournament = Omit<Tournament, "startTimestamp" | "endTimestamp" | "players"> & {
  startTimestamp: Date;
  endTimestamp: Date;
  players: readonly string[];
};

function mapMeleeMajorsTournament(tournament: Tournament): MeleeMajorsTournament {
  return {
    ...tournament,
    startTimestamp: new Date(tournament.startTimestamp),
    endTimestamp: new Date(tournament.endTimestamp),
    players: tournament.players.filter(exists),
  };
}
