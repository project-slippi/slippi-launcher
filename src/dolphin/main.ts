import { fileExists } from "common/utils";

import { assertDolphinInstallations } from "./downloadDolphin";
import {
  checkPlayKeyExists,
  configureDolphin,
  downloadDolphin,
  reinstallDolphin,
  removePlayKeyFile,
  storePlayKeyFile,
} from "./ipc";
import { dolphinManager } from "./manager";
import { deletePlayKeyFile, findPlayKey, writePlayKeyFile } from "./playkey";

downloadDolphin.main!.handle(async () => {
  await assertDolphinInstallations();
  return { success: true };
});

configureDolphin.main!.handle(async ({ dolphinType }) => {
  console.log("configuring dolphin...");
  await dolphinManager.configureDolphin(dolphinType);
  return { success: true };
});

reinstallDolphin.main!.handle(async ({ dolphinType }) => {
  console.log("reinstalling dolphin...");
  await dolphinManager.reinstallDolphin(dolphinType);
  return { success: true };
});

storePlayKeyFile.main!.handle(async ({ key }) => {
  await writePlayKeyFile(key);
  return { success: true };
});

checkPlayKeyExists.main!.handle(async () => {
  const keyPath = await findPlayKey();
  const exists = await fileExists(keyPath);
  return { exists };
});

removePlayKeyFile.main!.handle(async () => {
  await deletePlayKeyFile();
  return { success: true };
});
