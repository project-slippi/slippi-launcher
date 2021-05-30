import fs from "fs";

export async function fileExists(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (error) => {
      resolve(!error);
    });
  });
}
