// Based on: https://github.com/Richienb/extract-dmg/blob/4388bbbc806f7514f17d5a6d94556971cbf80096/index.js
// The included typings for extract-dmg are wrong!! It's actually an async function that needs awaiting!
// But the function is simple enough so let's just maintain it ourselves and fix the typing.

import { Preconditions } from "@common/preconditions";
import dmg from "dmg";
import * as fs from "fs-extra";

type ProgressCallback = (message: string) => void;

export async function extractDmg(
  filename: string,
  destination: string,
  onProgress?: ProgressCallback,
): Promise<string[]> {
  Preconditions.checkState(filename.endsWith(".dmg"), `Expected a dmg file, got ${filename}`);

  onProgress?.("Mounting DMG...");
  const mountPath = await mountDmg(filename, onProgress);

  onProgress?.("Reading DMG contents...");
  const files = await fs.readdir(mountPath);

  onProgress?.("Copying files from DMG...");
  await fs.copy(mountPath, destination, { recursive: true });

  onProgress?.("Unmounting DMG...");
  await unmountDmg(mountPath, onProgress);
  return files;
}

export async function mountDmg(filename: string, onProgress?: ProgressCallback): Promise<string> {
  return new Promise((resolve, reject) => {
    onProgress?.(`Mounting ${filename}...`);
    dmg.mount(filename, (err, value) => {
      if (err) {
        reject(err);
      } else {
        onProgress?.(`DMG mounted at: ${value}`);
        resolve(value);
      }
    });
  });
}

export async function unmountDmg(mountPath: string, onProgress?: ProgressCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    onProgress?.(`Unmounting ${mountPath}...`);
    dmg.unmount(mountPath, (err) => {
      if (err) {
        reject(err);
      } else {
        onProgress?.("DMG unmounted successfully");
        resolve();
      }
    });
  });
}
