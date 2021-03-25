import Alert from "@material-ui/lab/Alert";
import { Ports } from "@slippi/slippi-js";
import { StartBroadcastConfig } from "common/types";
import { ipcRenderer } from "electron";
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
  const slippiStatus = useConsole((store) => store.slippiConnectionStatus);
  const dolphinStatus = useConsole((store) => store.dolphinConnectionStatus);
  const error = useConsole((store) => store.broadcastError);
  const user = useApp((store) => store.user);
  const startBroadcast = async (config: Omit<StartBroadcastConfig, "authToken">) => {
    if (user !== null) {
      const authToken = await user.getIdToken();
      log.info("[Broadcast] Starting broadcast");
      ipcRenderer.send("startBroadcast", {
        ...config,
        authToken,
      });
    } else {
      handleError("Not logged in!");
    }
  };
  const stopBroadcast = async () => {
    ipcRenderer.send("stopBroadcast");
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
        onStartBroadcast={(viewerId) => {
          startBroadcast({
            ip,
            port,
            viewerId,
          });
        }}
      />
      <button onClick={() => stopBroadcast()}>disconnect</button>
      <pre>slippi status: {JSON.stringify(slippiStatus)}</pre>
      <pre>dolphin status: {JSON.stringify(dolphinStatus)}</pre>
      <pre>broadcast error: {JSON.stringify(error)}</pre>
    </Outer>
  );
};

const Outer = styled.div`
  height: 100%;
  width: 100%;
`;
