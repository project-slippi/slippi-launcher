import path from "path";
import { remote } from "electron";

export const NETPLAY_PATH = path.join(
  remote.app.getPath("userData"),
  "netplay"
);

export function getDefaultRootSlpPath(): string {
  let root = remote.app.getPath("home");
  if (process.platform === "win32") {
    root = remote.app.getPath("documents");
  }
  return path.join(root, "Slippi");
}

export function getDolphinPath(): string {
  switch (process.platform) {
    case "win32":
      return path.join(NETPLAY_PATH, "Dolphin.exe");
    default:
      throw new Error(`Unsupported OS: ${process.platform}`);
  }
}

export function getPlayKeyPath(): string {
  switch (process.platform) {
    case "win32":
      return path.join(NETPLAY_PATH, "user.json");
    default:
      throw new Error(`Unsupported OS: ${process.platform}`);
  }
}
