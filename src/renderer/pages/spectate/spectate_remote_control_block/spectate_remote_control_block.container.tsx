import React from "react";

import { useSpectateRemoteControlPort } from "@/lib/hooks/use_settings";
import { useSpectateRemoteServer } from "@/lib/hooks/use_spectate_remote_server";

import { SpectateRemoteControlBlock } from "./spectate_remote_control_block";

export const SpectateRemoteControlBlockContainer = React.memo(() => {
  const [errorMessage, setErrorMessage] = React.useState("");

  const [spectateRemoteServerState, startSpectateRemoteServer, stopSpectateRemoteServer] = useSpectateRemoteServer();
  const [spectateRemoteControlPort] = useSpectateRemoteControlPort();

  const [starting, setStarting] = React.useState(false);

  const onStart = async () => {
    setStarting(true);
    try {
      const { success, err } = await startSpectateRemoteServer(spectateRemoteControlPort);
      if (!success && err) {
        setErrorMessage(err);
      } else {
        setErrorMessage("");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error starting server");
    } finally {
      setStarting(false);
    }
  };

  const onStop = async () => {
    await stopSpectateRemoteServer();
  };

  return (
    <SpectateRemoteControlBlock
      serverStatus={spectateRemoteServerState.started ? "started" : starting ? "starting" : "stopped"}
      connected={spectateRemoteServerState.connected}
      port={spectateRemoteControlPort}
      errorMessage={errorMessage}
      onStart={onStart}
      onStop={onStop}
    />
  );
});
