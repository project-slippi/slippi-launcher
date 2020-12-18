import path from "path";
import { remote } from "electron";

export function getDefaultRootSlpPath(): string {
  let root = remote.app.getPath("home");
  if (process.platform === "win32") {
    root = remote.app.getPath("documents");
  }
  return path.join(root, "Slippi");
}
