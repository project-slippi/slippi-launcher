import log from "electron-log";

import { consoleDiscovery } from "./discovery";
import { addMirrorConfig, startDiscovery, startMirroring, stopDiscovery } from "./ipc";
import { mirrorManager } from "./mirrorManager";

addMirrorConfig.main!.handle(async ({ config }) => {
  mirrorManager.start(config);
  return { success: true };
});

startMirroring.main!.handle(async ({ ip }) => {
  mirrorManager
    .startMirroring(ip)
    .catch((err: Error) => log.info(`[Mirroring] Failed to start mirroring Wii @ ${ip}\n${err}`));
  return { success: true };
});

startDiscovery.main!.handle(async () => {
  consoleDiscovery.startScanning();
  return { success: true };
});

stopDiscovery.main!.handle(async () => {
  consoleDiscovery.stopScanning();
  return { success: true };
});
