import { execFile } from "node:child_process";
import path from "node:path";

export async function installVcRedist() {
  // This only makes sense on Windows
  if (process.platform !== "win32") {
    return 0;
  }

  const scriptPath = path.join(process.resourcesPath, "include", "ensure_vcredist.ps1");

  return new Promise<number>((resolve) => {
    execFile(
      "powershell.exe",
      ["-ExecutionPolicy", "Bypass", "-File", scriptPath],
      { timeout: 5 * 60 * 1000 },
      (err) => {
        if (err) {
          const code = typeof err.code === "number" ? err.code : 1;
          resolve(code);
          return;
        }
        resolve(0);
      },
    );
  });
}
