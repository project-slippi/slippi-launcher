import { connectionScanner } from "./connectionScanner";
import {
  ipc_connectToConsoleMirror,
  ipc_disconnectFromConsoleMirror,
  ipc_startDiscovery,
  ipc_startMirroring,
  ipc_stopDiscovery,
} from "./ipc";
import { mirrorWorker } from "./mirror.worker.interface";

export default function installConsoleIpc() {
  ipc_connectToConsoleMirror.main!.handle(async ({ config }) => {
    const mWorker = await mirrorWorker;
    await mWorker.connectToConsole(config);
    return { success: true };
  });

  ipc_disconnectFromConsoleMirror.main!.handle(async ({ ip }) => {
    const mWorker = await mirrorWorker;
    await mWorker.disconnectFromConsole(ip);
    return { success: true };
  });

  ipc_startMirroring.main!.handle(async ({ ip }) => {
    const mWorker = await mirrorWorker;
    await mWorker.startMirroring(ip);
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
}
