import { connectionScanner } from "./connectionScanner";
import {
  connectToConsoleMirror,
  disconnectFromConsoleMirror,
  startDiscovery,
  startMirroring,
  stopDiscovery,
} from "./ipc";
import { mirrorManager } from "./mirrorManager";

connectToConsoleMirror.main!.handle(async ({ config }) => {
  await mirrorManager.connect(config);
  return { success: true };
});

disconnectFromConsoleMirror.main!.handle(async ({ ip }) => {
  mirrorManager.disconnect(ip);
  return { success: true };
});

startMirroring.main!.handle(async ({ ip }) => {
  await mirrorManager.startMirroring(ip);
  return { success: true };
});

startDiscovery.main!.handle(async () => {
  await connectionScanner.startScanning();
  return { success: true };
});

stopDiscovery.main!.handle(async () => {
  connectionScanner.stopScanning();
  return { success: true };
});
