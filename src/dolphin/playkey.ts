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
  let dolphinDir = "";
  switch (process.platform) {
    case "win32": {
      const dolphinPath = await installation.findDolphinExecutable();
      dolphinDir = path.dirname(dolphinPath);
      break;
    }
    case "darwin": {
      dolphinDir = path.join(os.homedir(), "Library", "Application Support", "com.project-slippi.dolphin", "Slippi");
      break;
    }
    case "linux": {
      dolphinDir = path.join(os.homedir(), ".config", "SlippiOnline");
      break;
    }
    default: {
      break;
    }
  }
  await fs.ensureDir(dolphinDir);
  return path.resolve(dolphinDir, "user.json");
}

export async function deletePlayKeyFile(installation: DolphinInstallation): Promise<void> {
  const keyPath = await findPlayKey(installation);
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await fs.unlink(keyPath);
  }
}
