// Based on https://stackoverflow.com/a/66507546

import * as fs from "fs-extra";
import { basename, dirname } from "path";
import { URL } from "url";

const TIMEOUT = 10000;

export async function download(
  url: string,
  destination: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const uri = new URL(url);
  let dest = destination;
  if (!dest) {
    dest = basename(uri.pathname);
  }

  // Make sure the folder exists
  await fs.ensureDir(dirname(destination));

  const usesHttps = url.toLowerCase().startsWith("https:");
  const pkg = usesHttps ? await import("https") : await import("http");
  let totalBytes = 0;
  let receivedBytes = 0;

  return new Promise((resolve, reject) => {
    const request = pkg.get(uri.href).on("response", (res) => {
      const statusCode = res.statusCode ?? -1;

      switch (statusCode) {
        case 200: {
          const contentLength = res.headers["content-length"];
          if (contentLength) {
            totalBytes = parseInt(contentLength);
          }
          const file = fs.createWriteStream(dest, { flags: "wx" });
          res
            .on("data", (chunk) => {
              file.write(chunk);
              receivedBytes += chunk.length;
              onProgress && onProgress(receivedBytes, totalBytes);
            })
            .on("end", () => {
              file.end();
              // console.log(`${uri.pathname} downloaded to: ${path}`)
              resolve();
            })
            .on("error", (err) => {
              file.destroy();
              fs.unlink(dest, () => reject(err));
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

          void download(nextUrl, dest, onProgress).then(() => resolve());
          break;
        }
        default:
          reject(new Error(`Download request failed, response status: ${res.statusCode} ${res.statusMessage}`));
          break;
      }
    });

    request.setTimeout(TIMEOUT, () => {
      request.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT / 1000.0}s`));
    });
  });
}
