import electronSettings from "electron-settings";
import { checkDolphinUpdates, openDolphin } from "./downloadDolphin";

export async function startGame(log: (status: string) => void): Promise<void> {
  log("Checking for Dolphin installation...");
  await checkDolphinUpdates(log);

  const meleeFile = await electronSettings.get("settings.isoPath");
  if (!meleeFile) {
    throw new Error("Melee ISO is not specified");
  }

  log("Starting game...");
  openDolphin(["-b", "-e", meleeFile as string]);
}
