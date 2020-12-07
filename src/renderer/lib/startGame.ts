import { checkDolphinUpdates, openDolphin } from "./downloadDolphin";

export async function startGame(log: (status: string) => void): Promise<void> {
  log("Checking for Dolphin installation...");
  await checkDolphinUpdates(log);
  log("Starting game...");
  openDolphin();
}
