import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import React from "react";
import { FolderTreeNode } from "./FolderTreeNode";
import { FileList } from "./FileList";
import { DualPane } from "@/components/DualPane";

export const ReplayBrowser: React.FC = () => {
  const folders = useReplays((store) => store.folders);
  const loadDirectoryList = useReplays((store) => store.loadDirectoryList);
  const loadFolder = useReplays((store) => store.loadFolder);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  React.useEffect(() => {
    loadDirectoryList(rootSlpPath);
    loadFolder();
  }, [rootSlpPath, loadDirectoryList]);

  if (folders === null) {
    return null;
  }
  return (
    <DualPane
      id="replay-browser"
      resizable={true}
      leftSide={<FolderTreeNode {...folders} />}
      rightSide={<FileList />}
    />
  );
};
