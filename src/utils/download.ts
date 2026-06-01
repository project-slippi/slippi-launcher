import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";

import { fileExists } from "./file_exists";

export async function download(options: {
  url: string;
  destinationFile: string;
  onProgress?: (progress: { transferredBytes: number; totalBytes: number }) => void;
  overwrite?: boolean;
}): Promise<void> {
  const { url, destinationFile, onProgress, overwrite } = options;

  if (!overwrite && (await fileExists(destinationFile))) {
    throw new Error(`Could not download to ${destinationFile}. File already exists!`);
  }

  // Make sure the folder exists
  await mkdir(dirname(destinationFile), { recursive: true });

  const file = createWriteStream(destinationFile);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download ${url}: HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error(`Failed to download ${url}: Response body is empty`);
    }

    const totalBytes = Number(response.headers.get("content-length") ?? 0);

    let transferredBytes = 0;

    const reader = response.body.getReader();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      transferredBytes += value.length;

      onProgress?.({
        transferredBytes,
        totalBytes,
      });

      if (!file.write(value)) {
        await new Promise<void>((resolve) => {
          file.once("drain", resolve);
        });
      }
    }

    file.end();

    await new Promise<void>((resolve, reject) => {
      file.once("finish", resolve);
      file.once("error", reject);
    });
  } catch (err) {
    file.destroy();

    await unlink(destinationFile).catch(() => {});

    throw err;
  }
}
