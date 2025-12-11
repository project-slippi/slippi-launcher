import path from "path";
import { isSubdirectory } from "utils/is_subdirectory";

import { listSubFoldersAsync } from "./streaming_folder_service";
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
    // Use non-blocking async iteration instead of synchronous fs.readdir()
    childNode.subdirectories = await listSubFoldersAsync(folder);
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
      // Use non-blocking async iteration
      res.subdirectories = await listSubFoldersAsync(res.fullPath);
    }

    return this._findChild(folder, res.subdirectories);
  }
}

/**
 * Returns the tree structure of a folder using non-blocking async iteration.
 * @param folder - The folder path to scan for subdirectories
 * @returns Array of subdirectories, sorted by name
 * @deprecated Use listSubFoldersAsync from streaming_folder_service.ts directly
 */
export async function generateSubFolderTree(folder: string): Promise<FolderResult[]> {
  console.log(`generating subfolder tree for folder: ${folder}`);
  // Use non-blocking async iteration instead of fs.readdir()
  return listSubFoldersAsync(folder);
}
