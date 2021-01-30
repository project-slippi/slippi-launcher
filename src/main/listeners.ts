import { ipcMain, nativeImage } from "electron";
import path from "path";

export function setupListeners() {
  ipcMain.on("ondragstart", (event, filePath) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(path.join(__static, "images", "file.png")),
    });
  });
}
