/* eslint-disable import/no-default-export */

import {
  ipc_checkDesktopAppDolphin,
  ipc_checkPlayKeyExists,
  ipc_clearDolphinCache,
  ipc_configureDolphin,
  ipc_dolphinClosedEvent,
  ipc_dolphinDownloadFinishedEvent,
  ipc_dolphinDownloadLogReceivedEvent,
  ipc_downloadDolphin,
  ipc_importDolphinSettings,
  ipc_launchNetplayDolphin,
  ipc_reinstallDolphin,
  ipc_removePlayKeyFile,
  ipc_storePlayKeyFile,
  ipc_viewSlpReplay,
} from "./ipc";
import type { DolphinLaunchType, PlayKey, ReplayQueueItem } from "./types";

export default {
  async downloadDolphin() {
    await ipc_downloadDolphin.renderer!.trigger({});
  },
  async configureDolphin(dolphinType: DolphinLaunchType) {
    await ipc_configureDolphin.renderer!.trigger({ dolphinType });
  },
  async reinstallDolphin(dolphinType: DolphinLaunchType) {
    await ipc_reinstallDolphin.renderer!.trigger({ dolphinType });
  },
  async clearDolphinCache(dolphinType: DolphinLaunchType) {
    await ipc_clearDolphinCache.renderer!.trigger({ dolphinType });
  },
  async storePlayKeyFile(key: PlayKey) {
    await ipc_storePlayKeyFile.renderer!.trigger({ key });
  },
  async checkPlayKeyExists(key: PlayKey): Promise<boolean> {
    const { result } = await ipc_checkPlayKeyExists.renderer!.trigger({ key });
    return result.exists;
  },
  async removePlayKeyFile(): Promise<void> {
    await ipc_removePlayKeyFile.renderer!.trigger({});
  },
  async viewSlpReplay(files: ReplayQueueItem[]): Promise<void> {
    await ipc_viewSlpReplay.renderer!.trigger({ files });
  },
  async launchNetplayDolphin(options: { bootToCss?: boolean }): Promise<void> {
    await ipc_launchNetplayDolphin.renderer!.trigger(options);
  },
  async checkDesktopAppDolphin() {
    const { result } = await ipc_checkDesktopAppDolphin.renderer!.trigger({});
    return result;
  },
  async importDolphinSettings(options: { toImportDolphinPath: string; dolphinType: DolphinLaunchType }): Promise<void> {
    await ipc_importDolphinSettings.renderer!.trigger(options);
  },
  onDolphinDownloadFinished(handle: (error: string | null) => void) {
    const { destroy } = ipc_dolphinDownloadFinishedEvent.renderer!.handle(async ({ error }) => {
      handle(error);
    });
    return destroy;
  },
  onDolphinDownloadLogMessage(handle: (message: string) => void) {
    const { destroy } = ipc_dolphinDownloadLogReceivedEvent.renderer!.handle(async ({ message }) => {
      handle(message);
    });
    return destroy;
  },
  onDolphinClosed(handle: (result: { dolphinType: DolphinLaunchType; exitCode: number | null }) => void) {
    const { destroy } = ipc_dolphinClosedEvent.renderer!.handle(async (result) => {
      handle(result);
    });
    return destroy;
  },
};
