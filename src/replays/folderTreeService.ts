import * as fs from "fs-extra";
import path from "path";

import type { FolderResult } from "./types";

export class FolderTreeService {
  public tree: readonly FolderResult[] = [];

  public init(rootFolders: readonly string[]): readonly FolderResult[] {
    this.tree = rootFolders.map((fullPath) => {
      const name = path.basename(fullPath);
      return { name, fullPath, subdirectories: [], collapsed: false };
    });
    return this.tree;
  }

  public async select(folder: string): Promise<readonly FolderResult[]> {
    const childNode = this._findChild(folder, this.tree);
    childNode.subdirectories = await generateSubFolderTree(folder);
    return this.tree;
  }

  private _findChild(folder: string, nodes: readonly FolderResult[]): FolderResult {
    const res = nodes.find(({ fullPath }) => folder.startsWith(fullPath));
    if (!res) {
      throw new Error(`Could not find folder ${folder}`);
    }

    if (res.fullPath === folder) {
      // We're done
      return res;
    }

    return this._findChild(folder, res.subdirectories);
  }
}

/**
 * Returns the tree structure of a folder
 * @param folder Details including name, and subdirectories
 * @param childrenToExpand The name of the subdirectories to expand.
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
    .map(
      async (dirent): Promise<FolderResult> => {
        return {
          name: dirent.name,
          fullPath: path.join(folder, dirent.name),
          subdirectories: [],
        };
      },
    );

  return Promise.all(subdirectories);
}
