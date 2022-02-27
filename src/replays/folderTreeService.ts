import * as fs from "fs-extra";
import path from "path";

import type { FolderResult } from "./types";

export class FolderTreeService {
  private tree: readonly FolderResult[] = [];

  public init(rootFolders: readonly string[]): readonly FolderResult[] {
    this.tree = rootFolders.map((fullPath) => {
      const name = path.basename(fullPath);
      return { name, fullPath, subdirectories: [], collapsed: false };
    });
    return this.tree;
  }

  public async select(folder: string): Promise<readonly FolderResult[]> {
    const childNode = await this._findChild(folder, this.tree);
    childNode.subdirectories = await generateSubFolderTree(folder);
    return this.tree;
  }

  private async _findChild(folder: string, nodes: readonly FolderResult[]): Promise<FolderResult> {
    const res = nodes.find(({ fullPath }) => fullPath === folder || isSubdirectory(fullPath, folder));
    if (!res) {
      throw new Error(`Could not find folder ${folder}`);
    }

    if (res.fullPath === folder) {
      // We're done
      return res;
    }

    // Expand the subdirectories if necessary
    if (res.subdirectories.length === 0) {
      res.subdirectories = await generateSubFolderTree(res.fullPath);
    }

    return this._findChild(folder, res.subdirectories);
  }
}

/**
 * Returns the tree structure of a folder
 * @param folder Details including name, and subdirectories
 */
export async function generateSubFolderTree(folder: string): Promise<FolderResult[]> {
  console.log(`generating subfolder tree for folder: ${folder}`);
  // Only generate the tree for a single level
  let results: fs.Dirent[] = [];
  try {
    // The directory we're expanding might not actually exist.
    results = await fs.readdir(folder, { withFileTypes: true });
  } catch (err) {
    // If it doesn't exist, just return an empty list.
    console.warn(err);
    return [];
  }

  const subdirectories = results
    .filter((dirent) => {
      return dirent.isDirectory();
    })
    .map(async (dirent): Promise<FolderResult> => {
      return {
        name: dirent.name,
        fullPath: path.join(folder, dirent.name),
        subdirectories: [],
      };
    });

  return Promise.all(subdirectories);
}

// Taken from: https://stackoverflow.com/questions/37521893/determine-if-a-path-is-subdirectory-of-another-in-node-js
const isSubdirectory = (parent: string, dir: string): boolean => {
  const relative = path.relative(parent, dir);
  const isSubdir = Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
  return isSubdir;
};
