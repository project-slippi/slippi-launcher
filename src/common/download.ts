// Based on: https://github.com/stephan83/download-github-release/blob/master/src/download.js

import fs from "fs";
import http from "http";
import https from "https";

export function download(url: string, destf: string, progressCallback?: (percent: number) => void) {
  const w = fs.createWriteStream(destf);

  const progress = (percent: number) => {
    if (progressCallback) {
      progressCallback(percent);
    }
  };

  return new Promise((resolve, reject) => {
    let protocol = /^https:/.exec(url) ? https : http;

    progress(0);

    protocol
      .get(url, (res1) => {
        const location = res1.headers.location || "";
        protocol = /^https:/.exec(location) ? https : http;

        protocol
          .get(location, (res2) => {
            const total = parseInt(res2.headers["content-length"] as string, 10);
            let completed = 0;
            res2.pipe(w);
            res2.on("data", (data) => {
              completed += data.length;
              progress(completed / total);
            });
            res2.on("progress", progress);
            res2.on("error", reject);
            res2.on("end", resolve);
          })
          .on("error", reject);
      })
      .on("error", reject);
  });
}
