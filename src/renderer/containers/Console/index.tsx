import { addMirrorConfig, startDiscovery, startMirroring, stopDiscovery } from "@console/ipc";
import { MirrorConfig } from "@console/types";
import styled from "@emotion/styled";
import { Ports } from "@slippi/slippi-js";
import React from "react";

import { AvailableConsoleList } from "./AvailableConsoleList";

export const Console: React.FC = () => {
  const mirrorConfigHandler = async () => {
    const config: MirrorConfig = {
      ipAddress: "192.168.1.39",
      port: Ports.DEFAULT,
      folderPath: "C:\\Users\\Nikhi\\Documents\\Slippi\\test",
      isRealTimeMode: true,
      autoSwitcherSettings: {
        ip: "localhost:4444", // should do validation to ensure port is provided or have a separate port field
        sourceName: "dolphin",
      },
    };
    await addMirrorConfig.renderer!.trigger({ config });
  };

  const startMirrorHandler = async () => {
    await startMirroring.renderer!.trigger({ ip: "192.168.1.39" });
  };

  React.useEffect(() => {
    // Start scanning for new consoles
    startDiscovery.renderer!.trigger({});

    // Stop scanning on component unmount
    return () => {
      stopDiscovery.renderer!.trigger({});
    };
  }, []);

  return (
    <Outer>
      <h1>Console</h1>
      <button onClick={mirrorConfigHandler}>Connect to Wii</button>
      <button onClick={startMirrorHandler}>Mirror Wii</button>
      <AvailableConsoleList />
    </Outer>
  );
};

const Outer = styled.div`
  height: 100%;
  width: 100%;
  margin: 0 20px;
`;
