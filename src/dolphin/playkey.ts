import type { PlayKey } from "@dolphin/types";
import * as fs from "fs-extra";
import os from "os";
import path from "path";
import { fileExists } from "utils/fileExists";

import type { DolphinInstallation } from "./install/installation";

export async function writePlayKeyFile(installation: DolphinInstallation, playKey: PlayKey): Promise<void> {
  const keyPath = await findPlayKey(installation);
  const contents = JSON.stringify(playKey, null, 2);
  await fs.writeFile(keyPath, contents);
}

export async function findPlayKey(installation: DolphinInstallation): Promise<string> {
  let slippiDir = "";
  switch (process.platform) {
    case "win32": {
      const dolphinPath = await installation.findDolphinExecutable();
      const dolphinFolder = path.dirname(dolphinPath);
      slippiDir = path.join(dolphinFolder, "User", "Slippi");
      break;
    }
    case "darwin": {
      slippiDir = path.join(os.homedir(), "Library", "Application Support", "com.project-slippi.dolphin", "Slippi");
      break;
    }
    case "linux": {
      slippiDir = path.join(os.homedir(), ".config", "SlippiOnline", "Slippi");
      break;
    }
    default: {
      break;
    }
  }
  await fs.ensureDir(slippiDir);
  return path.resolve(slippiDir, "user.json");
}

export async function deletePlayKeyFile(installation: DolphinInstallation): Promise<void> {
  const keyPath = await findPlayKey(installation);
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await fs.unlink(keyPath);
  }
}
