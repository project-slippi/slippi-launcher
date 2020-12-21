import { FolderResult } from "@/lib/replayBrowser";
import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import React from "react";

const RenderFolder: React.FC<FolderResult> = (props) => {
  const { name, subdirectories, fullPath } = props;
  const loadDirectoryList = useReplays((store) => store.loadDirectoryList);
  const onClick = () => {
    console.log(`loading directory: ${name}`);
    loadDirectoryList(fullPath);
  };
  return (
    <div>
      <h3 onClick={onClick} style={{ cursor: "pointer" }}>
        {name}
      </h3>
      {subdirectories.map((f) => (
        <RenderFolder key={f.fullPath} {...f} />
      ))}
    </div>
  );
};

export const ReplayBrowser: React.FC = () => {
  const folders = useReplays((store) => store.folders);
  const loadDirectoryList = useReplays((store) => store.loadDirectoryList);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  React.useEffect(() => {
    loadDirectoryList(rootSlpPath);
  }, [rootSlpPath, loadDirectoryList]);
  return <div>{folders === null ? null : <RenderFolder {...folders} />}</div>;
};
