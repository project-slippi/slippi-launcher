import { connectionScanner } from "./connectionScanner";
import {
  ipc_connectToConsoleMirror,
  ipc_disconnectFromConsoleMirror,
  ipc_startDiscovery,
  ipc_startMirroring,
  ipc_stopDiscovery,
} from "./ipc";
import { mirrorManager } from "./mirrorManager";

ipc_connectToConsoleMirror.main!.handle(async ({ config }) => {
  await mirrorManager.connect(config);
  return { success: true };
});

ipc_disconnectFromConsoleMirror.main!.handle(async ({ ip }) => {
  mirrorManager.disconnect(ip);
  return { success: true };
});

ipc_startMirroring.main!.handle(async ({ ip }) => {
  await mirrorManager.startMirroring(ip);
  return { success: true };
});

ipc_startDiscovery.main!.handle(async () => {
  await connectionScanner.startScanning();
  return { success: true };
});

ipc_stopDiscovery.main!.handle(async () => {
  connectionScanner.stopScanning();
  return { success: true };
});
