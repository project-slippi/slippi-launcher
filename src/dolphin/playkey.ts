import type { DolphinInstallation, PlayKey } from "@dolphin/types";
import * as fs from "fs-extra";
import { fileExists } from "utils/fileExists";

export async function writePlayKeyFile(installation: DolphinInstallation, playKey: PlayKey): Promise<void> {
  const keyPath = await installation.findPlayKey();
  const contents = JSON.stringify(playKey, null, 2);
  await fs.writeFile(keyPath, contents);
}

export async function deletePlayKeyFile(installation: DolphinInstallation): Promise<void> {
  const keyPath = await installation.findPlayKey();
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await fs.unlink(keyPath);
  }
}
