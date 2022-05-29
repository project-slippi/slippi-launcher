// Based on: https://github.com/Richienb/extract-dmg/blob/4388bbbc806f7514f17d5a6d94556971cbf80096/index.js
// The included typings for extract-dmg are wrong!! It's actually an async function that needs awaiting!
// But the function is simple enough so let's just maintain it ourselves and fix the typing.

import dmg from "dmg";
import * as fs from "fs-extra";

export async function extractDmg(filename: string, destination: string): Promise<string[]> {
  if (!filename.endsWith(".dmg")) {
    throw new Error(`Expected a dmg file, got ${filename}`);
  }

  const mountPath = await mountDmg(filename);
  const files = await fs.readdir(mountPath);
  await fs.copy(mountPath, destination, { recursive: true });
  await unmountDmg(mountPath);
  return files;
}

async function mountDmg(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    dmg.mount(filename, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}

async function unmountDmg(mountPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    dmg.unmount(mountPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
