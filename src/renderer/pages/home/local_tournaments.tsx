import { useQuery } from "react-query";

import { getLocation } from "@/lib/geolocation";

export const LocalTournaments = () => {
  const geoLocationQuery = useQuery(["geoLocationQuery"], async () => {
    const result = await getLocation();
    console.log("query result: ", { result });
    return result;
  });
  return (
    <div>
      <h1>hello world</h1>
      <code>{JSON.stringify(geoLocationQuery.data)}</code>
    </div>
  );
};
