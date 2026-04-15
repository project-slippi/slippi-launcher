import { useQuery } from "react-query";

import { ExternalLink as A } from "@/components/external_link";

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

const SmashMapCard = ({ name, url, imageSrc }: { name: string; url: string; imageSrc: string }) => {
  return (
    <div>
      <img src={imageSrc} />
      <A href={url}>{name}</A>
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
    const result = await fetch("https://meleemajors.gg/api/v1/tournaments.json").then((res) => res.json());
    console.log(result);
    return result;
  });
  const geoLocationQuery = useQuery(["geoLocationQuery"], async () => {
    // const result = await getLocation();
    // console.log("query result: ", { result });
    // const smashMapResult = await fetch(
    //   `https://smash-map.com/api/events?lat=${result.lat}&lng=${result.lng}&radius=100&games=1&paginate=false`,
    // ).then((res) => res.json());
    // console.log("query smash map result: ", { smashMapResult });
    const events = await window.electron.fetch.fetchNearestTournaments();
    console.log(events);
    return { events };
  });
  return (
    <div>
      <button onClick={() => window.electron.shell.openLocationServices()}>open location services</button>
      <h1>Smash Map</h1>
      {geoLocationQuery.data &&
        geoLocationQuery.data.events.map((event, index) => (
          <SmashMapCard key={index} name={event.name} url={event.link} imageSrc={event.image.url} />
        ))}
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
