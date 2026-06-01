/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { Preconditions } from "@common/preconditions";
import { app } from "electron";
import { pathExists } from "fs-extra";
import { mkdir, open, rm, stat as fsStat } from "node:fs/promises";
import path from "path";
import { URL } from "url";

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === "development") {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, "../renderer/", htmlFileName)}`;
  };
}

export const getAssetPath = (...paths: string[]): string => {
  const resourcesPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets")
    : path.join(__dirname, "../../assets");
  return path.resolve(path.join(resourcesPath, ...paths));
};

// Implemenation taken from https://github.com/alexbbt/read-last-lines/blob/11945800b013fe5016c4ea36e49d28c67aa75e7c/src/index.js
export async function readLastLines(
  inputFilePath: string,
  maxLineCount: number,
  encoding: BufferEncoding = "utf-8",
): Promise<string> {
  const fileExists = await pathExists(inputFilePath);
  Preconditions.checkState(fileExists, `${inputFilePath} does not exist`);

  // Load file Stats.
  const fileStat = await fsStat(inputFilePath);

  // Open file for reading.
  const file = await open(inputFilePath, "r");

  const bufferSize = Math.min(16384, fileStat.size);
  const readBuffer = new Uint8Array(bufferSize);
  let readBufferRemaining = 0;
  const allBytes: number[] = [];
  let lineCount = 0;
  let fileOffset = fileStat.size;

  while (lineCount < maxLineCount && fileOffset > 0) {
    // Read the next chunk of the file
    const readSize = Math.min(readBuffer.length, fileOffset);
    fileOffset -= readSize;
    const readResult = await file.read(readBuffer, 0, readSize, fileOffset);

    // If there's still data in our read buffer, then finish processing that
    readBufferRemaining = readResult.bytesRead;
    while (readBufferRemaining > 0) {
      const bufferIndex = readBufferRemaining - 1;
      if (readBuffer[bufferIndex] === 0x0a && allBytes.length) {
        ++lineCount;
        if (lineCount >= maxLineCount) {
          break;
        }
      }
      allBytes.push(readBuffer[readBufferRemaining - 1]);
      --readBufferRemaining;
    }
  }

  await file.close();

  // Reverse the array
  allBytes.reverse();

  return Buffer.from(allBytes).toString(encoding);
}

export async function clearTempFolder() {
  const tmpDir = path.join(app.getPath("userData"), "temp");
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
}
