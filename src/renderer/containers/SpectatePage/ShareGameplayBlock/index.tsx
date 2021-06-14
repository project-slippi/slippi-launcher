import { Ports } from "@slippi/slippi-js";
import React from "react";

import { useAccount } from "@/lib/hooks/useAccount";
import { useBroadcast } from "@/lib/hooks/useBroadcast";
import { useConsole } from "@/store/console";

import { InfoBlock } from "../InfoBlock";
import { BroadcastPanel } from "./BroadcastPanel";

// These are the default params for broadcasting Netplay Dolphin
const ip = "127.0.0.1";
const port = Ports.DEFAULT;

export const ShareGameplayBlock: React.FC<{ className?: string }> = ({ className }) => {
  const playKey = useAccount((store) => store.playKey);
  const startTime = useConsole((store) => store.startTime);
  const endTime = useConsole((store) => store.endTime);
  const slippiStatus = useConsole((store) => store.slippiConnectionStatus);
  const dolphinStatus = useConsole((store) => store.dolphinConnectionStatus);
  const [start, stop] = useBroadcast();
  return (
    <InfoBlock title="Share your gameplay" className={className}>
      <BroadcastPanel
        slippiServerStatus={slippiStatus}
        dolphinStatus={dolphinStatus}
        startTime={startTime}
        endTime={endTime}
        onDisconnect={stop}
        onStartBroadcast={(viewerId: string) => {
          start({
            ip,
            port,
            viewerId,
            name: playKey ? playKey.connectCode : undefined,
          });
        }}
      />
    </InfoBlock>
  );
};
