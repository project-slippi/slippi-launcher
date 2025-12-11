import * as fs from "fs";
import path from "path";

import type { FolderResult } from "./types";

export interface FolderScanProgress {
  scanned: number;
  foundFolders: number;
  folders: FolderResult[];
  complete: boolean;
}

export interface FileScanProgress {
  scanned: number;
  slpFiles: string[];
  complete: boolean;
}

/**
 * Streams subdirectories of a folder in chunks to avoid blocking the main thread.
 * Uses fs.promises.opendir() with async iteration for non-blocking I/O.
 *
 * This yields progress updates that can be sent to the renderer to keep the UI responsive.
 *
 * @param folder - The folder path to scan
 * @param chunkSize - How many folders to discover before yielding progress (default: 50)
 * @yields Progress updates with discovered folders
 */
export async function* streamSubFoldersChunked(folder: string, chunkSize = 50): AsyncGenerator<FolderScanProgress> {
  let scanned = 0;
  let foundFolders = 0;
  const folders: FolderResult[] = [];

  try {
    // Use opendir for async iteration (non-blocking)
    const dir = await fs.promises.opendir(folder);

    for await (const dirent of dir) {
      scanned++;

      if (dirent.isDirectory()) {
        foundFolders++;
        folders.push({
          name: dirent.name,
          fullPath: path.join(folder, dirent.name),
          subdirectories: [],
        });

        // Yield progress every N folders found (not every entry)
        if (foundFolders % chunkSize === 0) {
          yield {
            scanned,
            foundFolders,
            folders: sortFolders([...folders]),
            complete: false,
          };
        }
      }
    }
  } catch (err) {
    console.warn(`Error reading directory ${folder}:`, err);
  }

  // Final yield with complete sorted results
  yield {
    scanned,
    foundFolders,
    folders: sortFolders(folders),
    complete: true,
  };
}

/**
 * Lists all subdirectories in a folder using async iteration to avoid blocking.
 * This replaces the synchronous fs.readdir() approach.
 *
 * @param folder - The folder path to scan
 * @returns Array of subdirectory results, sorted by name
 */
export async function listSubFoldersAsync(folder: string): Promise<FolderResult[]> {
  const folders: FolderResult[] = [];

  try {
    // Use async iteration with opendir to avoid blocking main thread
    const dir = await fs.promises.opendir(folder);

    for await (const dirent of dir) {
      if (dirent.isDirectory()) {
        folders.push({
          name: dirent.name,
          fullPath: path.join(folder, dirent.name),
          subdirectories: [],
        });
      }
    }
  } catch (err) {
    console.warn(`Error reading directory ${folder}:`, err);
    return [];
  }

  return sortFolders(folders);
}

/**
 * Streams .slp files from a folder for database sync.
 * Uses async iteration to avoid blocking when scanning large directories.
 *
 * @param folder - The folder path to scan for .slp files
 * @param chunkSize - How many entries to scan before yielding progress (default: 200)
 * @yields Progress updates with discovered .slp filenames
 */
export async function* streamSlpFiles(folder: string, chunkSize = 200): AsyncGenerator<FileScanProgress> {
  let scanned = 0;
  const slpFiles: string[] = [];

  try {
    const dir = await fs.promises.opendir(folder);

    for await (const dirent of dir) {
      scanned++;

      if (dirent.isFile() && path.extname(dirent.name) === ".slp") {
        slpFiles.push(dirent.name);
      }

      // Yield progress every N entries scanned
      if (scanned % chunkSize === 0) {
        yield {
          scanned,
          slpFiles: [...slpFiles],
          complete: false,
        };
      }
    }
  } catch (err) {
    console.warn(`Error reading directory ${folder}:`, err);
  }

  // Final yield with all discovered files
  yield {
    scanned,
    slpFiles,
    complete: true,
  };
}

/**
 * Helper to sort folders by name with natural/numeric sorting
 */
function sortFolders(folders: FolderResult[]): FolderResult[] {
  return folders.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}
