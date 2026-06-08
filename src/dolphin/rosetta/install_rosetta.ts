import { execFile } from "node:child_process";

export async function installRosettaElevated() {
  // This only makes sense on macOS
  if (process.platform !== "darwin") {
    return;
  }

  return new Promise<number>((resolve) => {
    const script = `
      do shell script "/usr/sbin/softwareupdate --install-rosetta --agree-to-license" with administrator privileges
    `;

    execFile("/usr/bin/osascript", ["-e", script], (err) => {
      if (err) {
        const code = typeof err.code === "number" ? err.code : 1;
        resolve(code);
        return;
      }
      resolve(0);
    });
  });
}
