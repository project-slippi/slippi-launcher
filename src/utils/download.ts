// Based on https://stackoverflow.com/a/66507546

import * as fs from "fs-extra";
import { dirname } from "path";
import { URL } from "url";

import { fileExists } from "./fileExists";

const SECOND = 1000;
const TIMEOUT = 30 * SECOND;

export async function download(options: {
  url: string;
  destinationFile: string;
  onProgress?: (progress: { transferredBytes: number; totalBytes: number }) => void;
  overwrite?: boolean;
}): Promise<void> {
  const { url, destinationFile, onProgress, overwrite } = options;
  const uri = new URL(url);

  if (!overwrite && (await fileExists(destinationFile))) {
    throw new Error(`Could not download to ${destinationFile}. File already exists!`);
  }

  // Make sure the folder exists
  await fs.ensureDir(dirname(destinationFile));

  const usesHttps = uri.protocol.startsWith("https");
  const { get } = usesHttps ? await import("https") : await import("http");
  let totalBytes = 0;
  let transferredBytes = 0;

  return new Promise((resolve, _reject) => {
    const reject = (err: Error) => {
      // Clean up our file
      fs.unlink(destinationFile, () => _reject(err));
    };

    const request = get(uri.href).on("response", (res) => {
      const statusCode = res.statusCode ?? -1;

      switch (statusCode) {
        case 200: {
          const contentLength = res.headers["content-length"];
          if (contentLength) {
            totalBytes = parseInt(contentLength);
          }

          const file = fs.createWriteStream(destinationFile, { flags: "wx" });
          file.on("error", (err) => {
            file.destroy();
            reject(err);
          });

          res
            .on("data", (chunk) => {
              file.write(chunk, (err) => {
                if (!err) {
                  transferredBytes += chunk.length;
                  onProgress && onProgress({ transferredBytes, totalBytes });
                }
              });
            })
            .on("end", () => {
              // Only resolve the promise once the file has completely finished writing.
              // We attach this listener here since calling file.destroy() also triggers the close event.
              file.on("close", () => {
                resolve();
              });

              // Indicate we're done writing
              file.end();
            })
            .on("error", (err) => {
              file.destroy();
              reject(err);
            });
          break;
        }
        case 301:
        case 302: {
          // Recursively follow redirects, only a 200 will resolve.
          const nextUrl = res.headers.location;
          if (!nextUrl) {
            reject(new Error("Error downloading file"));
            return;
          }

          void download({ ...options, url: nextUrl }).then(() => resolve());
          break;
        }
        default:
          reject(new Error(`Download request failed, response status: ${res.statusCode} ${res.statusMessage}`));
          break;
      }
    });

    request.setTimeout(TIMEOUT, () => {
      request.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT / SECOND}s`));
    });
  });
}
