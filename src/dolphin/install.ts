import { isLinux, isMac } from "@common/constants";
import { app } from "electron";
import * as fs from "fs-extra";
import { isEqual } from "lodash";
import path from "path";

import { fileExists } from "../main/fileExists";
import { assertDolphinInstallations } from "./downloadDolphin";
import {
  ipc_checkDesktopAppDolphin,
  ipc_checkPlayKeyExists,
  ipc_clearDolphinCache,
  ipc_configureDolphin,
  ipc_dolphinClosedEvent,
  ipc_downloadDolphin,
  ipc_importDolphinSettings,
  ipc_launchNetplayDolphin,
  ipc_reinstallDolphin,
  ipc_removePlayKeyFile,
  ipc_storePlayKeyFile,
  ipc_viewSlpReplay,
} from "./ipc";
import { dolphinManager } from "./manager";
import { deletePlayKeyFile, findPlayKey, writePlayKeyFile } from "./playkey";
import { DolphinLaunchType } from "./types";
import { findDolphinExecutable, updateBootToCssCode } from "./util";

export default function installDolphinIpc() {
  ipc_downloadDolphin.main!.handle(async () => {
    await assertDolphinInstallations();
    return { success: true };
  });

  ipc_configureDolphin.main!.handle(async ({ dolphinType }) => {
    console.log("configuring dolphin...");
    await dolphinManager.configureDolphin(dolphinType);
    return { success: true };
  });

  ipc_reinstallDolphin.main!.handle(async ({ dolphinType }) => {
    console.log("reinstalling dolphin...");
    await dolphinManager.reinstallDolphin(dolphinType);
    return { success: true };
  });

  ipc_clearDolphinCache.main!.handle(async ({ dolphinType }) => {
    console.log("clearing dolphin cache...");
    await dolphinManager.clearCache(dolphinType);
    return { success: true };
  });

  ipc_storePlayKeyFile.main!.handle(async ({ key }) => {
    await writePlayKeyFile(key);
    return { success: true };
  });

  ipc_checkPlayKeyExists.main!.handle(async ({ key }) => {
    const keyPath = await findPlayKey();
    const exists = await fileExists(keyPath);
    if (exists) {
      const jsonKey = await fs.readFile(keyPath);
      const storedKey = JSON.parse(jsonKey.toString());
      return { exists: isEqual(storedKey, key) };
    }
    return { exists };
  });

  ipc_removePlayKeyFile.main!.handle(async () => {
    await deletePlayKeyFile();
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
    await updateBootToCssCode({ enable: Boolean(bootToCss) });

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

    await dolphinManager.copyDolphinConfig(dolphinType, dolphinPath);

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

  dolphinManager.on("playback-dolphin-closed", async (_playbackId: string, code = 0) => {
    void ipc_dolphinClosedEvent.main!.trigger({ dolphinType: DolphinLaunchType.PLAYBACK, exitCode: code });
  });

  dolphinManager.on("netplay-dolphin-closed", async (code = 0) => {
    void ipc_dolphinClosedEvent.main!.trigger({ dolphinType: DolphinLaunchType.NETPLAY, exitCode: code });
  });
}
