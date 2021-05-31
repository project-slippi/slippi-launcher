import { startBroadcast, stopBroadcast } from "@broadcast/ipc";
import { StartBroadcastConfig } from "@broadcast/types";
import Alert from "@material-ui/lab/Alert";
import { Ports } from "@slippi/slippi-js";
import log from "electron-log";
import React from "react";
import styled from "styled-components";

import { useApp } from "@/store/app";
import { useConsole } from "@/store/console";

import { ConsoleItem } from "./ConsoleItem";

const handleError = (error: any) => {
  const { showSnackbar, dismissSnackbar } = useApp.getState();
  const message = error.message || JSON.stringify(error);
  showSnackbar(
    <Alert onClose={dismissSnackbar} severity="error">
      {message}
    </Alert>,
  );
};

export const Broadcast: React.FC = () => {
  const startTime = useConsole((store) => store.startTime);
  const endTime = useConsole((store) => store.endTime);
  const slippiStatus = useConsole((store) => store.slippiConnectionStatus);
  const dolphinStatus = useConsole((store) => store.dolphinConnectionStatus);
  const error = useConsole((store) => store.broadcastError);
  const user = useApp((store) => store.user);
  const startBroadcastHandler = async (config: Omit<StartBroadcastConfig, "authToken">) => {
    if (!user) {
      handleError("Not logged in!");
      return;
    }

    const authToken = await user.getIdToken();
    log.info("[Broadcast] Starting broadcast");
    await startBroadcast.renderer!.trigger({
      ...config,
      authToken,
    });
  };
  const disconnectHandler = async () => {
    await stopBroadcast.renderer!.trigger({});
  };

  const ip = "127.0.0.1";
  const port = Ports.DEFAULT;
  return (
    <Outer>
      <h1>Broadcast</h1>
      <ConsoleItem
        name="Slippi Dolpin"
        ip={ip}
        port={port}
        slippiServerStatus={slippiStatus}
        dolphinStatus={dolphinStatus}
        startTime={startTime}
        endTime={endTime}
        onDisconnect={disconnectHandler}
        onStartBroadcast={(viewerId) => {
          startBroadcastHandler({
            ip,
            port,
            viewerId,
          });
        }}
      />
      {error && <pre>Error occurred while broadcasting: {JSON.stringify(error)}</pre>}
    </Outer>
  );
};

const Outer = styled.div`
  height: 100%;
  width: 100%;
  margin: 0 20px;
`;
