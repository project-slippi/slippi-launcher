import { Ports } from "@slippi/slippi-js";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { InfoBlock } from "@/components/InfoBlock";
import { useAccount } from "@/lib/hooks/useAccount";
import { useBroadcast } from "@/lib/hooks/useBroadcast";
import { useConsole } from "@/lib/hooks/useConsole";

import { BroadcastPanel } from "./BroadcastPanel";

const log = console;

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
  const { addToast } = useToasts();

  return (
    <InfoBlock title="Share your gameplay" className={className}>
      <BroadcastPanel
        slippiServerStatus={slippiStatus}
        dolphinStatus={dolphinStatus}
        startTime={startTime}
        endTime={endTime}
        onDisconnect={stop}
        onStartBroadcast={async (viewerId: string) => {
          try {
            await start({
              ip,
              port,
              viewerId,
              name: playKey ? playKey.connectCode : undefined,
            });
          } catch (err) {
            log.error(err);
            addToast("Error connecting to Dolphin. Ensure Dolphin is running and try again.", { appearance: "error" });
          }
        }}
      />
    </InfoBlock>
  );
};
