import { watchBroadcast } from "@broadcast/ipc";
import React from "react";

import { useBroadcastList } from "@/lib/hooks/useBroadcastList";

const SECOND = 1000;
const AUTO_REFRESH_INTERVAL = 30 * SECOND;

export const SpectatePage: React.FC = () => {
  const [currentBroadcasts, refreshBroadcasts] = useBroadcastList();

  React.useEffect(() => {
    // Refresh once on component mount
    refreshBroadcasts();

    // Start automatic refreshing of the broadcast list
    const interval = setInterval(refreshBroadcasts, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const startWatching = async (id: string) => {
    await watchBroadcast.renderer!.trigger({ broadcasterId: id });
  };

  return (
    <div>
      <h1>Spectate</h1>
      <div>
        <div style={{ display: "flex" }}>
          <button onClick={refreshBroadcasts}>refresh</button>
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
