import { isMac } from "common/constants";
import path from "path";

import { fileExists } from "../main/fileExists";
import { assertDolphinInstallations } from "./downloadDolphin";
import {
  ipc_checkPlayKeyExists,
  ipc_clearDolphinCache,
  ipc_configureDolphin,
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

ipc_checkPlayKeyExists.main!.handle(async () => {
  const keyPath = await findPlayKey();
  const exists = await fileExists(keyPath);
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

ipc_launchNetplayDolphin.main!.handle(async () => {
  await dolphinManager.launchNetplayDolphin();
  return { success: true };
});

ipc_importDolphinSettings.main!.handle(async ({ toImportDolphinPath, type }) => {
  if (isMac) {
    toImportDolphinPath = path.join("Contents", "Resources");
  } else {
    toImportDolphinPath = path.dirname(toImportDolphinPath);
  }

  await dolphinManager.copyDolphinConfig(type, toImportDolphinPath);

  return { success: true };
});
