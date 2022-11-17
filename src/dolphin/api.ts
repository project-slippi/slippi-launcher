/* eslint-disable import/no-default-export */

import {
  ipc_checkDesktopAppDolphin,
  ipc_checkPlayKeyExists,
  ipc_configureDolphin,
  ipc_dolphinEvent,
  ipc_downloadDolphin,
  ipc_hardResetDolphin,
  ipc_importDolphinSettings,
  ipc_launchNetplayDolphin,
  ipc_removePlayKeyFile,
  ipc_softResetDolphin,
  ipc_storePlayKeyFile,
  ipc_viewSlpReplay,
} from "./ipc";
import type {
  DolphinEventMap,
  DolphinEventType,
  DolphinLaunchType,
  DolphinService,
  PlayKey,
  ReplayQueueItem,
} from "./types";

const dolphinApi: DolphinService = {
  async downloadDolphin(dolphinType: DolphinLaunchType) {
    await ipc_downloadDolphin.renderer!.trigger({ dolphinType });
  },
  async configureDolphin(dolphinType: DolphinLaunchType) {
    await ipc_configureDolphin.renderer!.trigger({ dolphinType });
  },
  async softResetDolphin(dolphinType: DolphinLaunchType) {
    await ipc_softResetDolphin.renderer!.trigger({ dolphinType });
  },
  async hardResetDolphin(dolphinType: DolphinLaunchType) {
    await ipc_hardResetDolphin.renderer!.trigger({ dolphinType });
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
  onEvent<T extends DolphinEventType>(eventType: T, handle: (event: DolphinEventMap[T]) => void) {
    const { destroy } = ipc_dolphinEvent.renderer!.handle(async (result) => {
      if (result.type === eventType) {
        handle(result as DolphinEventMap[T]);
      }
    });
    return destroy;
  },
};

export default dolphinApi;
