/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { app } from "electron";
import * as fs from "fs-extra";
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

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, "assets")
  : path.join(__dirname, "../../assets");

export const getAssetPath = (...paths: string[]): string => {
  return path.resolve(path.join(RESOURCES_PATH, ...paths));
};

// Implemenation taken from https://github.com/alexbbt/read-last-lines/blob/11945800b013fe5016c4ea36e49d28c67aa75e7c/src/index.js
export async function readLastLines(
  inputFilePath: string,
  maxLineCount: number,
  encoding: BufferEncoding = "utf-8",
): Promise<string> {
  const exists = await fs.pathExists(inputFilePath);
  if (!exists) {
    throw new Error("file does not exist");
  }

  // Load file Stats.
  const stat = await fs.stat(inputFilePath);

  // Open file for reading.
  const file = await fs.open(inputFilePath, "r");

  const bufferSize = Math.min(16384, stat.size);
  const readBuffer = Buffer.alloc(bufferSize);
  let readBufferRemaining = 0;
  const allBytes = [];
  let lineCount = 0;
  let fileOffset = stat.size;

  while (lineCount < maxLineCount && fileOffset > 0) {
    // Read the next chunk of the file
    const readSize = Math.min(readBuffer.length, fileOffset);
    fileOffset -= readSize;
    const readResult = await fs.read(file, readBuffer, 0, readSize, fileOffset);

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

  await fs.close(file);

  // Reverse the array
  allBytes.reverse();

  return Buffer.from(allBytes).toString(encoding);
}
