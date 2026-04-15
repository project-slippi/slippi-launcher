import { useQuery } from "react-query";

import { ExternalLink as A } from "@/components/external_link";
import { useCountdown } from "@/lib/hooks/use_countdown";

// type MeleeMajorsResponse = {
//   lastUpdated: string;
//   tournaments: MeleeMajorTournament[];
// };

type MeleeMajorTournament = {
  "city-and-state": string;
  "date-string": string;
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

const SmashMapCard = ({
  name,
  url,
  imageSrc,
  distanceKms,
  prefersMiles,
  startDate,
}: {
  name: string;
  url: string;
  imageSrc: string;
  distanceKms: number;
  prefersMiles: boolean;
  startDate: Date;
}) => {
  const distanceToRender = prefersMiles ? distanceKms / 1.609 : distanceKms;
  const unitsToRender = prefersMiles ? "mi" : "km";
  const { formatted } = useCountdown(startDate, { format: ["days"] });

  return (
    <div>
      <img src={imageSrc} />
      <span>starts in: {formatted}</span>
      <A href={url}>
        {name} ({distanceToRender.toFixed(2)} {unitsToRender})
      </A>
    </div>
  );
};

const MajorTournamentCard = ({ name, url, imageSrc }: { name: string; url: string; imageSrc: string }) => {
  return (
    <div>
      <img src={imageSrc} />
      <A href={url}>{name}</A>
    </div>
  );
};

export const LocalTournaments = () => {
  const meleeMajorsQuery = useQuery(["meleeMajorsQuery"], async () => {
    // This endpoint seems to not be blocked by CORS so we can just fetch it in the frontend
    const result = await fetch("https://meleemajors.gg/api/v1/tournaments.json").then((res) => res.json());
    console.log(result);
    return result;
  });
  const geoLocationQuery = useQuery(["geoLocationQuery"], async () => {
    const result = await window.electron.fetch.fetchCurrentLocation();
    console.log("query result: ", { result });
    const events = await window.electron.fetch.fetchNearestTournaments({ lat: result.lat, lng: result.lon });
    console.log(events);
    return { events, ip: result };
  });
  return (
    <div>
      <h1>Smash Map</h1>
      {geoLocationQuery.data &&
        geoLocationQuery.data.events.map((event, index) => {
          const distanceKms = haversineDistanceKm(
            geoLocationQuery.data.ip.lat,
            geoLocationQuery.data.ip.lon,
            event.location.lat,
            event.location.lng,
          );
          const prefersMiles = ["US", "GB"].includes(geoLocationQuery.data.ip.countryCode);
          return (
            <SmashMapCard
              key={index}
              name={event.name}
              url={event.url}
              imageSrc={event.imageSrc}
              startDate={event.startDate}
              distanceKms={distanceKms}
              prefersMiles={prefersMiles}
            />
          );
        })}
      <pre>{JSON.stringify(geoLocationQuery.data, null, 2)}</pre>
      <h1>Melee Majors</h1>
      {meleeMajorsQuery.data &&
        (meleeMajorsQuery.data.tournaments as MeleeMajorTournament[]).map((tournament, index) => (
          <MajorTournamentCard
            key={index}
            name={tournament.name}
            url={tournament["start.gg-url"]}
            imageSrc={tournament["image-url"]}
          />
        ))}
      <pre>{JSON.stringify(meleeMajorsQuery.data, null, 2)}</pre>
    </div>
  );
};

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  return R * c;
}
