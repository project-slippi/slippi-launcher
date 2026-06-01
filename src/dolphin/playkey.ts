import type { DolphinInstallation, PlayKey } from "@dolphin/types";
import { unlink, writeFile } from "node:fs/promises";
import { fileExists } from "utils/file_exists";

export async function writePlayKeyFile(installation: DolphinInstallation, playKey: PlayKey): Promise<void> {
  const keyPath = await installation.findPlayKey();
  const contents = JSON.stringify(playKey, null, 2);
  await writeFile(keyPath, contents);
}

export async function deletePlayKeyFile(installation: DolphinInstallation): Promise<void> {
  const keyPath = await installation.findPlayKey();
  const playKeyExists = await fileExists(keyPath);
  if (playKeyExists) {
    await unlink(keyPath);
  }
}
