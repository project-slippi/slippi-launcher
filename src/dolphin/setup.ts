import { app } from "electron";
import log from "electron-log";
import * as fs from "fs-extra";
import { isEqual } from "lodash";
import path from "path";
import { fileExists } from "utils/fileExists";

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
import type { DolphinManager } from "./manager";
import { deletePlayKeyFile, findPlayKey, writePlayKeyFile } from "./playkey";
import { DolphinLaunchType } from "./types";
import { findDolphinExecutable, updateBootToCssCode } from "./util";

const isMac = process.platform === "darwin";
const isLinux = process.platform === "linux";

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
    const keyPath = await findPlayKey(installation);
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

  ipc_importDolphinSettings.main!.handle(async ({ toImportDolphinPath, dolphinType }) => {
    let dolphinPath = toImportDolphinPath;
    if (isMac) {
      dolphinPath = path.join(dolphinPath, "Contents", "Resources");
    } else {
      dolphinPath = path.dirname(dolphinPath);
    }

    const installation = dolphinManager.getInstallation(dolphinType);
    await installation.importConfig(dolphinPath);
    return { success: true };
  });

  ipc_checkDesktopAppDolphin.main!.handle(async () => {
    // get the path and check existence
    const desktopAppPath = path.join(app.getPath("appData"), "Slippi Desktop App");
    let exists = await fs.pathExists(desktopAppPath);

    if (!exists) {
      return { dolphinPath: "", exists: false };
    }

    // Linux doesn't need to do anything because their dolphin settings are in a user config dir
    if (isLinux && exists) {
      await fs.remove(desktopAppPath);
      return { dolphinPath: "", exists: false };
    }

    const dolphinFolderPath = path.join(desktopAppPath, "dolphin");
    exists = await fs.pathExists(dolphinFolderPath);

    const dolphinExecutablePath = await findDolphinExecutable(DolphinLaunchType.NETPLAY, dolphinFolderPath);

    return { dolphinPath: dolphinExecutablePath, exists: exists };
  });

  return { dolphinManager };
}
