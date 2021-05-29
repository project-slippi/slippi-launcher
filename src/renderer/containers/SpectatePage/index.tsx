import { fetchBroadcastList, watchBroadcast } from "@broadcast/ipc";
import CircularProgress from "@material-ui/core/CircularProgress";
import React from "react";
import { useQuery } from "react-query";

import { useApp } from "@/store/app";

const SECOND = 1000;
const AUTO_REFRESH_INTERVAL = 30 * SECOND;

export const SpectatePage: React.FC = () => {
  const currentUser = useApp((store) => store.user);
  const broadcastListQuery = useQuery(["broadcastList", currentUser], async () => {
    if (!currentUser) {
      throw new Error("User is not logged in");
    }
    const authToken = await currentUser.getIdToken();
    const broadcastListResult = await fetchBroadcastList.renderer!.trigger({ authToken });
    if (!broadcastListResult.result) {
      throw new Error("Error fetching broadcast list");
    }
    return broadcastListResult.result.items;
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      broadcastListQuery.refetch();
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const startWatching = async (id: string) => {
    await watchBroadcast.renderer!.trigger({ broadcasterId: id });
  };
  const currentBroadcasts = broadcastListQuery.data ?? [];

  return (
    <div>
      <h1>Spectate</h1>
      <div>
        <div style={{ display: "flex" }}>
          {broadcastListQuery.isFetching && (
            <div style={{ color: "white", marginRight: 5 }}>
              <CircularProgress color="inherit" size={20} />
            </div>
          )}
          <button onClick={() => broadcastListQuery.refetch()} disabled={broadcastListQuery.isFetching}>
            refresh
          </button>
        </div>
        {currentBroadcasts.length === 0 ? (
          <div>No users broadcasting to you.</div>
        ) : (
          currentBroadcasts.map((data) => {
            return (
              <div key={data.id}>
                <div>{data.broadcaster.name}</div>
                <div>{data.name}</div>
                <button onClick={() => startWatching(data.id)}>watch</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
