import { Ports } from "@slippi/slippi-js";
import log from "electron-log";

import { InfoBlock } from "@/components/info_block";
import { useAccount } from "@/lib/hooks/use_account";
import { useBroadcast } from "@/lib/hooks/use_broadcast";
import { useConsole } from "@/lib/hooks/use_console";
import { useToasts } from "@/lib/hooks/use_toasts";

import { BroadcastPanel } from "./broadcast_panel";
import { ShareGameplayBlockMessages as Messages } from "./share_gameplay_block.messages";

// These are the default params for broadcasting Netplay Dolphin
const ip = "127.0.0.1";
const port = Ports.DEFAULT;

export const ShareGameplayBlock = ({ className }: { className?: string }) => {
  const userData = useAccount((store) => store.userData);
  const startTime = useConsole((store) => store.startTime);
  const endTime = useConsole((store) => store.endTime);
  const slippiStatus = useConsole((store) => store.slippiConnectionStatus);
  const dolphinStatus = useConsole((store) => store.dolphinConnectionStatus);
  const [start, stop] = useBroadcast();
  const { showError } = useToasts();

  return (
    <InfoBlock title={Messages.shareYourGameplay()} className={className}>
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
              name: userData?.playKey ? userData.playKey.connectCode : undefined,
            });
          } catch (err) {
            log.error(err);
            showError(Messages.errorConnectingToDolphin());
          }
        }}
      />
    </InfoBlock>
  );
};
