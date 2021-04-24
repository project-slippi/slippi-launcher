import { BroadcasterItem } from "common/types";
import { ipcRenderer as ipc } from "electron-better-ipc";
import React from "react";
import { useQuery } from "react-query";

import { useApp } from "@/store/app";

export const SpectatePage: React.FC = () => {
  const currentUser = useApp((store) => store.user);
  const broadcastListQuery = useQuery(["broadcastList", currentUser], async () => {
    if (!currentUser) {
      throw new Error("User is not logged in");
    }
    const authToken = await currentUser.getIdToken();
    return ipc.callMain<string, BroadcasterItem[]>("fetchBroadcastList", authToken);
  });
  const onClickHandler = () => {
    broadcastListQuery.refetch();
  };
  const startWatching = (id: string) => {
    return ipc.callMain<string, never>("watchBroadcast", id);
  };
  const currentBroadcasts = broadcastListQuery.data ?? [];
  return (
    <div>
      <h1>Spectate</h1>
      <div>
        <button onClick={onClickHandler}>refresh broadcast list</button>
        {broadcastListQuery.isFetching && <div>Refreshing...</div>}
        {currentBroadcasts.map((data) => {
          return (
            <div key={data.id}>
              <div>{data.broadcaster.name}</div>
              <div>{data.name}</div>
              <button onClick={() => startWatching(data.id)}>watch</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
