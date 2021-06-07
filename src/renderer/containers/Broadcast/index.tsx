import styled from "@emotion/styled";
import { addMirrorConfig, startMirroring } from "@mirror/ipc";
import { MirrorDetails } from "@mirror/types";
import { Ports } from "@slippi/slippi-js";
import React from "react";

export const Broadcast: React.FC = () => {
  const mirrorConfigHandler = async () => {
    const config: MirrorDetails = {
      ipAddress: "192.168.1.64",
      port: Ports.DEFAULT,
      folderPath: "C:\\Users\\Nikhi\\Documents\\Slippi\\test",
      isMirroring: false,
      isRealTimeMode: true,
    };
    await addMirrorConfig.renderer!.trigger({ config });
  };

  const startMirrorHandler = async () => {
    await startMirroring.renderer!.trigger({ ip: "192.168.1.64" });
  };
  return (
    <Outer>
      <button onClick={mirrorConfigHandler}>Connect to Wii</button>
      <button onClick={startMirrorHandler}>Mirror Wii</button>
      <h1>Broadcast</h1>
    </Outer>
  );
};

const Outer = styled.div`
  height: 100%;
  width: 100%;
  margin: 0 20px;
`;
