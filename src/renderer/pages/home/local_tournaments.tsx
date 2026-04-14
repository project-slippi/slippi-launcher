import { useQuery } from "react-query";

import { getLocation } from "@/lib/location_service";

export const LocalTournaments = () => {
  const geoLocationQuery = useQuery(["geoLocationQuery"], async () => {
    const result = await getLocation();
    // console.log("query result: ", { result });
    // const smashMapResult = await fetch(
    //   `https://smash-map.com/api/events?lat=${result.lat}&lng=${result.lng}&radius=100&games=1&paginate=false`,
    // ).then((res) => res.json());
    // console.log("query smash map result: ", { smashMapResult });
    const r = await window.electron.fetch.fetchNearestTournaments(result);
    console.log(r);
    return r;
  });
  return (
    <div>
      <h1>hello world</h1>
      <code>{JSON.stringify(geoLocationQuery.data)}</code>
    </div>
  );
};
