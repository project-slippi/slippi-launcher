import type { DolphinManager } from "@dolphin/manager";
import type { DolphinPlaybackClosedEvent } from "@dolphin/types";
import { DolphinEventType, DolphinLaunchType } from "@dolphin/types";
import log from "electron-log";

import { connectionScanner } from "./connectionScanner";
import {
  ipc_connectToConsoleMirror,
  ipc_disconnectFromConsoleMirror,
  ipc_startDiscovery,
  ipc_startMirroring,
  ipc_stopDiscovery,
} from "./ipc";
import type { MirrorWorker } from "./mirror.worker.interface";
import { createMirrorWorker } from "./mirror.worker.interface";

export default function setupConsoleIpc({ dolphinManager }: { dolphinManager: DolphinManager }) {
  let mirrorWorker: MirrorWorker | undefined;

  dolphinManager.events
    .filter<DolphinPlaybackClosedEvent>((event) => {
      return event.type === DolphinEventType.CLOSED && event.dolphinType === DolphinLaunchType.PLAYBACK;
    })
    .subscribe((event) => {
      if (mirrorWorker) {
        void mirrorWorker.dolphinClosed(event.instanceId).catch(log.error);
      }
    });

  ipc_connectToConsoleMirror.main!.handle(async ({ config }) => {
    if (!mirrorWorker) {
      // Only initialize the worker when we actually start connecting
      mirrorWorker = await createMirrorWorker(dolphinManager);
    }

    await mirrorWorker.connectToConsole(config);
    return { success: true };
  });

  ipc_disconnectFromConsoleMirror.main!.handle(async ({ ip }) => {
    if (!mirrorWorker) {
      throw new Error("Failed to disconnect from console. Was the console connected to begin with?");
    }

    await mirrorWorker.disconnectFromConsole(ip);

    return { success: true };
  });

  ipc_startMirroring.main!.handle(async ({ ip }) => {
    if (!mirrorWorker) {
      throw new Error("Failed to start mirroring. Is the console connected?");
    }

    await mirrorWorker.startMirroring(ip);
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
