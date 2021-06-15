import { consoleDiscovery } from "./discovery";
import { addMirrorConfig, startDiscovery, startMirroring, stopDiscovery } from "./ipc";
import { mirrorManager } from "./mirrorManager";

addMirrorConfig.main!.handle(async ({ config }) => {
  mirrorManager.start(config);
  return { success: true };
});

startMirroring.main!.handle(async ({ ip }) => {
  mirrorManager.startMirroring(ip);
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
