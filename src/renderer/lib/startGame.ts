import { DolphinType } from "./directories";
import { assertDolphinInstallation, openDolphin } from "./downloadDolphin";
import { assertPlayKey } from "./playkey";

export async function startGame(
  log: (status: string) => void,
  meleeFile?: string
): Promise<void> {
  log("Checking for Dolphin installation...");
  await assertDolphinInstallation(DolphinType.NETPLAY, log);

  log("Checking user account...");
  await assertPlayKey();

  if (!meleeFile) {
    throw new Error("Melee ISO is not specified");
  }

  log("Starting game...");
  openDolphin(DolphinType.NETPLAY, ["-b", "-e", meleeFile]);
}
