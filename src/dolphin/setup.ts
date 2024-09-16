import { shell } from "electron";
import log from "electron-log";
import * as fs from "fs-extra";
import isEqual from "lodash/isEqual";
import { fileExists } from "utils/file_exists";

import {
  ipc_checkPlayKeyExists,
  ipc_configureDolphin,
  ipc_dolphinEvent,
  ipc_downloadDolphin,
  ipc_fetchGeckoCodes,
  ipc_hardResetDolphin,
  ipc_launchNetplayDolphin,
  ipc_openDolphinSettingsFolder,
  ipc_removePlayKeyFile,
  ipc_saveGeckoCodes,
  ipc_softResetDolphin,
  ipc_storePlayKeyFile,
  ipc_viewSlpReplay,
} from "./ipc";
import type { DolphinManager } from "./manager";
import { deletePlayKeyFile, writePlayKeyFile } from "./playkey";
import { DolphinLaunchType } from "./types";
import { fetchGeckoCodes, saveGeckoCodes, updateBootToCssCode } from "./util";

export default function setupDolphinIpc({ dolphinManager }: { dolphinManager: DolphinManager }) {
  dolphinManager.events.subscribe((event) => {
    void ipc_dolphinEvent.main!.trigger(event).catch(log.error);
  });

  ipc_downloadDolphin.main!.handle(async ({ dolphinType }) => {
    await dolphinManager.installDolphin(dolphinType);
    return { success: true };
  });

  ipc_configureDolphin.main!.handle(async ({ dolphinType }) => {
    console.log("configuring dolphin...");
    await dolphinManager.configureDolphin(dolphinType);
    return { success: true };
  });

  ipc_softResetDolphin.main!.handle(async ({ dolphinType }) => {
    console.log("soft resetting dolphin...");
    await dolphinManager.reinstallDolphin(dolphinType, false);
    return { success: true };
  });

  ipc_openDolphinSettingsFolder.main!.handle(async ({ dolphinType }) => {
    const dolphinInstall = dolphinManager.getInstallation(dolphinType);
    if (process.platform === "win32") {
      const path = dolphinInstall.installationFolder;
      await shell.openPath(path);
    } else {
      const path = dolphinInstall.userFolder;
      await shell.openPath(path);
    }
    return { success: true };
  });

  ipc_hardResetDolphin.main!.handle(async ({ dolphinType }) => {
    console.log("hard resetting dolphin...");
    await dolphinManager.reinstallDolphin(dolphinType, true);
    return { success: true };
  });

  ipc_storePlayKeyFile.main!.handle(async ({ key }) => {
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await writePlayKeyFile(installation, key);
    return { success: true };
  });

  ipc_checkPlayKeyExists.main!.handle(async ({ key }) => {
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    const keyPath = await installation.findPlayKey();
    const exists = await fileExists(keyPath);
    if (!exists) {
      return { exists: false };
    }

    try {
      const jsonKey = await fs.readFile(keyPath);
      const fileContents = jsonKey.toString();
      const storedKey = JSON.parse(fileContents);
      return { exists: isEqual(storedKey, key) };
    } catch (err) {
      log.warn(err);
      return { exists: false };
    }
  });

  ipc_removePlayKeyFile.main!.handle(async () => {
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await deletePlayKeyFile(installation);
    return { success: true };
  });

  ipc_viewSlpReplay.main!.handle(async ({ files }) => {
    await dolphinManager.launchPlaybackDolphin("playback", {
      mode: "queue",
      queue: files,
    });
    return { success: true };
  });

  ipc_launchNetplayDolphin.main!.handle(async ({ bootToCss }) => {
    // Boot straight to CSS if necessary
    const installation = dolphinManager.getInstallation(DolphinLaunchType.NETPLAY);
    await updateBootToCssCode(installation, { enable: Boolean(bootToCss) });

    // Actually launch Dolphin
    await dolphinManager.launchNetplayDolphin();
    return { success: true };
  });

  ipc_fetchGeckoCodes.main!.handle(async ({ dolphinType }) => {
    const installation = dolphinManager.getInstallation(dolphinType);
    const codes = await fetchGeckoCodes(installation);
    return { codes };
  });

  ipc_saveGeckoCodes.main!.handle(async ({ dolphinType, geckoCodes }) => {
    const installation = dolphinManager.getInstallation(dolphinType);
    await saveGeckoCodes(installation, geckoCodes);
    return { success: true };
  });

  return { dolphinManager };
}
