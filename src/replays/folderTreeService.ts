import path from "path";

import { generateSubFolderTree } from "./folderTree";
import type { FolderResult } from "./types";

export interface IFolderTreeService {
  init(folders: readonly string[]): readonly FolderResult[];
  select(folder: string): Promise<readonly FolderResult[]>;
}

export class FolderTreeService implements IFolderTreeService {
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
