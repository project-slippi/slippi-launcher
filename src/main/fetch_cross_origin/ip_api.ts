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

/**
 * Fetches the user's current location based on their IP address.
 * @param lang The language to use for the response, e.g. country, region, city names. Defaults to English if not provided.
 * @returns The user's current location information.
 */
export async function fetchCurrentLocation(lang?: string): Promise<UserLocationInfo> {
  const url = generateApiUrl(lang);
  const cachedResponse = cache.get(url);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch the data
  const res = await fetch(url);
  const data = (await res.json()) as IpApiResponse;
  Preconditions.checkState(data.status === "success", `Failed to fetch current location: ${data.status}`);

  // Cache the data
  cache.set(url, data);

  return data;
}

function generateApiUrl(lang?: string) {
  const url = new URL(API);
  if (lang) {
    url.searchParams.set("lang", mapToSupportedLanguage(lang));
  }
  return url.toString();
}

/**
 * Maps a language code to a supported language code for the IP API.
 *
 * The list of supported langauge values are:
 * - de    Deutsch (German)
 * - es    Español (Spanish)
 * - pt-BR Português - Brasil (Portuguese)
 * - fr    Français (French)
 * - ja    日本語 (Japanese)
 * - zh-CN 中国 (Chinese)
 * - ru    Русский (Russian)
 *
 * The lang value must match one of these exactly or it will default back to English.
 *
 * @param lang The language code to map.
 * @returns The mapped language code.
 */
function mapToSupportedLanguage(lang: string) {
  switch (lang) {
    case "pt":
      return "pt-BR";
    default:
      return lang;
  }
}
