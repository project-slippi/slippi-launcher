import { app } from "electron";
import * as fs from "fs-extra";
import path from "path";

// Returns a standard location for the temporary slippi comms files used to
// communicate with and instruct Slippi Dolphin.
export const generateTempCommsDirectoryPath = (): string => {
  const tmpDir = app.getPath("temp");
  return path.join(tmpDir, "slippi-comms");
};

// Cleans up any temp comms files that have been written to the temp
// folder that might still be lingering around, and reinitializes the directory.
//
// This really only needs to happen on macOS due to the way that the subprocess handling
// of Dolphin playback instances works - there's no graceful way at the moment to detect
// Dolphin close, so we just leave the files in there and expect that either:
//
// - The temp directory will be cleared at some point, as macOS eventually does
// - The eventual restart of this app will clear them up
//
// As this is a filesystem call it should be fine to happen relatively immediately
// and not require being a part of anything Electron-ready.
export const clearTempCommsDirectory = () => {
  const tempCommsDirectoryPath = generateTempCommsDirectoryPath();

  try {
    fs.removeSync(tempCommsDirectoryPath);
  } catch (err) {
    // Silence the linter; this is probably fine if it fails (e.g, it doesn't exist).
    console.log("");
  }
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
