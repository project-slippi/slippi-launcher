import { app } from "electron";
import log from "electron-log";
import { execFile } from "node:child_process";
import path from "node:path";
import { download } from "utils/download";

const VCREDIST_URL = "https://aka.ms/vs/17/release/vc_redist.x64.exe";

export async function installVcRedist(): Promise<number> {
  // This only makes sense on Windows
  if (process.platform !== "win32") {
    return 0;
  }

  const tmpDir = path.join(app.getPath("userData"), "temp");
  const filename = path.basename(new URL(VCREDIST_URL).pathname);
  const downloadPath = path.join(tmpDir, filename);

  try {
    await download({
      url: VCREDIST_URL,
      destinationFile: downloadPath,
      overwrite: true,
    });
  } catch (err) {
    log.error("Failed to download VC++ Redistributable", err);
    return 1;
  }

  return new Promise<number>((resolve) => {
    execFile(downloadPath, ["/install", "/passive", "/norestart"], { timeout: 5 * 60 * 1000 }, (err) => {
      if (err) {
        const code = typeof err.code === "number" ? err.code : 1;
        resolve(code);
        return;
      }
      resolve(0);
    });
  });
}
