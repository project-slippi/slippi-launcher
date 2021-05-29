import { app } from "electron";
import electronSettings from "electron-settings";
import * as fs from "fs-extra";
import path from "path";

import { DolphinLaunchType } from "./types";

export * from "./instance";
export * from "./manager";
export * from "./types";

export function getDefaultDolphinPath(type: DolphinLaunchType): string {
  const dolphinPath = path.join(app.getPath("userData"), type);
  return dolphinPath;
}

export async function findDolphinExecutable(type: DolphinLaunchType | string, dolphinPath = ""): Promise<string> {
  // Make sure the directory actually exists
  if (dolphinPath === "") {
    dolphinPath = (await electronSettings.get(`settings.${type}.path`)) as string;
    if (!dolphinPath) {
      dolphinPath = getDefaultDolphinPath(type as DolphinLaunchType);
    }
  }

  await fs.ensureDir(dolphinPath);

  // Check the directory contents
  const files = await fs.readdir(dolphinPath);
  const result = files.find((filename) => {
    switch (process.platform) {
      case "win32":
        return filename.endsWith("Dolphin.exe");
      case "darwin":
        return filename.endsWith("Dolphin.app");
      case "linux":
        return filename.endsWith(".AppImage");
      default:
        return false;
    }
  });

  if (!result) {
    throw new Error(`No Dolphin found in: ${dolphinPath}`);
  }

  return path.join(dolphinPath, result);
}
