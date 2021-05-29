import { DolphinLaunchType, PlayKey } from "@dolphin/types";
import { fileExists } from "common/utils";
import * as fs from "fs-extra";
import path from "path";

import { findDolphinExecutable } from "./util";

export async function writePlayKeyFile(playKey: PlayKey): Promise<void> {
  const keyPath = await findPlayKey();
  const contents = JSON.stringify(playKey, null, 2);
  await fs.writeFile(keyPath, contents);
}

export async function findPlayKey(): Promise<string> {
  const dolphinPath = await findDolphinExecutable(DolphinLaunchType.NETPLAY);
  let dolphinDir = path.dirname(dolphinPath);
  if (process.platform === "darwin") {
    dolphinDir = path.join(dolphinPath, "Contents", "Resources");
  }
  return path.resolve(dolphinDir, "user.json");
}

export async function deletePlayKeyFile(): Promise<void> {
  const keyPath = await findPlayKey();
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await fs.unlink(keyPath);
  }
}
