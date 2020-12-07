import React from "react";

import { useAsync } from "@/lib/hooks/useAsync";
import { fetchPlayKey } from "@/lib/playkey";

export const PlayKey: React.FC = () => {
  const [key, setKey] = React.useState("");
  const { execute, loading, error } = useAsync(async () => {
    const res = await fetchPlayKey();
    console.log(res);
    setKey(JSON.stringify(res, null, 2));
  });
  return (
    <div>
      <h3>play key:</h3>
      <pre>{key}</pre>
      <button onClick={execute} disabled={loading}>
        fetch play key
      </button>
      {error && <div>{error.message}</div>}
    </div>
  );
};
