import Alert from "@material-ui/lab/Alert";
import { ipcRenderer } from "electron";
import log from "electron-log";
import React from "react";

import { useApp } from "@/store/app";
import { useConsole } from "@/store/console";

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
  const startBroadcast = async () => {
    if (user !== null) {
      const token = await user.getIdToken();
      log.info("[Broadcast] Starting broadcast");
      ipcRenderer.send("startBroadcast", user.uid, token);
    } else {
      handleError("Not logged in!");
    }
  };
  const stopBroadcast = async () => {
    ipcRenderer.send("stopBroadcast");
  };
  return (
    <div>
      <h1>Broadcast</h1>
      <button onClick={() => startBroadcast()}>connect to dolphin</button>
      <button onClick={() => stopBroadcast()}>disconnect</button>
      <pre>slippi status: {JSON.stringify(slippiStatus)}</pre>
      <pre>dolphin status: {JSON.stringify(dolphinStatus)}</pre>
      <pre>broadcast error: {JSON.stringify(error)}</pre>
    </div>
  );
};
