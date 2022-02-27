/* eslint-disable import/no-default-export */

import {
  ipc_connectToConsoleMirror,
  ipc_consoleMirrorErrorMessageEvent,
  ipc_consoleMirrorStatusUpdatedEvent,
  ipc_disconnectFromConsoleMirror,
  ipc_discoveredConsolesUpdatedEvent,
  ipc_startDiscovery,
  ipc_startMirroring,
  ipc_stopDiscovery,
} from "./ipc";
import type { ConsoleMirrorStatusUpdate, DiscoveredConsoleInfo, MirrorConfig } from "./types";

export default {
  async connectToConsoleMirror(config: MirrorConfig) {
    await ipc_connectToConsoleMirror.renderer!.trigger({ config });
  },
  async disconnectFromConsole(ip: string) {
    await ipc_disconnectFromConsoleMirror.renderer!.trigger({ ip });
  },
  async startMirroring(ip: string) {
    await ipc_startMirroring.renderer!.trigger({ ip });
  },
  async startDiscovery() {
    await ipc_startDiscovery.renderer!.trigger({});
  },
  async stopDiscovery() {
    await ipc_stopDiscovery.renderer!.trigger({});
  },
  onDiscoveredConsolesUpdated(handle: (consoles: DiscoveredConsoleInfo[]) => void) {
    const { destroy } = ipc_discoveredConsolesUpdatedEvent.renderer!.handle(async ({ consoles }) => {
      handle(consoles);
    });
    return destroy;
  },
  onConsoleMirrorErrorMessage(handle: (message: string) => void) {
    const { destroy } = ipc_consoleMirrorErrorMessageEvent.renderer!.handle(async ({ message }) => {
      handle(message);
    });
    return destroy;
  },
  onConsoleMirrorStatusUpdated(handle: (result: { ip: string; info: Partial<ConsoleMirrorStatusUpdate> }) => void) {
    const { destroy } = ipc_consoleMirrorStatusUpdatedEvent.renderer!.handle(async (result) => {
      handle(result);
    });
    return destroy;
  },
};
