import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import React from "react";
import { FolderTreeNode } from "./FolderTreeNode";
import { FileList } from "./FileList";
import { DualPane } from "@/components/DualPane";
import RefreshIcon from "@material-ui/icons/Refresh";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";

export const ReplayBrowser: React.FC = () => {
  const folders = useReplays((store) => store.folders);
  const init = useReplays((store) => store.init);
  const currentFolder = useReplays((store) => store.currentFolder);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  React.useEffect(() => {
    init(rootSlpPath);
  }, [rootSlpPath, init]);

  const refresh = React.useCallback(() => {
    init(rootSlpPath, true, currentFolder);
  }, [rootSlpPath, init, currentFolder]);

  if (folders === null) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexFlow: "column", flex: "1" }}>
      <div>
        <Tooltip title="Refresh">
          <IconButton onClick={refresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>
      <DualPane
        id="replay-browser"
        resizable={true}
        minWidth={50}
        maxWidth={300}
        leftSide={<FolderTreeNode {...folders} />}
        rightSide={<FileList />}
      />
    </div>
  );
};
