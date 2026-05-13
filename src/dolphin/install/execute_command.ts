import { spawn } from "child_process";

/**
 * Execute a command and return its output
 * @param command The command to execute
 * @param args The arguments to pass to the command
 * @returns The output of the command
 */
export async function executeCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      // Dolphin often outputs version info to stderr, so prioritize stderr if stdout is empty
      const output = stdout.trim() || stderr.trim();

      if (code === 0 || output) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}
