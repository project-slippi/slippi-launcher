import type { PlayKey } from "@dolphin/types";
import { DolphinLaunchType } from "@dolphin/types";
import * as fs from "fs-extra";
import os from "os";
import path from "path";

import { fileExists } from "../main/fileExists";
import { findDolphinExecutable } from "./util";

export async function writePlayKeyFile(playKey: PlayKey): Promise<void> {
  const keyPath = await findPlayKey();
  const contents = JSON.stringify(playKey, null, 2);
  await fs.writeFile(keyPath, contents);
}

export async function findPlayKey(): Promise<string> {
  let dolphinDir = "";
  switch (process.platform) {
    case "win32": {
      const dolphinPath = await findDolphinExecutable(DolphinLaunchType.NETPLAY);
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

export async function deletePlayKeyFile(): Promise<void> {
  const keyPath = await findPlayKey();
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await fs.unlink(keyPath);
  }
}
