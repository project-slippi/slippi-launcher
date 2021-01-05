import path from "path";
import { ipcMain, nativeImage } from "electron";

export function setupListeners() {
  ipcMain.on("ondragstart", (event, filePath) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(
        path.join(__static, "images", "file.png")
      ),
    });
  });
}
