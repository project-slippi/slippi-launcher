import { useReplays } from "@/store/replays";
import { FolderResult } from "common/replayBrowser";
import React from "react";
import styled from "styled-components";

const OuterFolder = styled.div``;

const ChildFolder = styled.div`
  margin-left: 10px;
`;

export const FolderTreeNode: React.FC<FolderResult> = (props) => {
  const { name, subdirectories, fullPath, collapsed } = props;
  const loadDirectoryList = useReplays((store) => store.loadDirectoryList);
  const loadFolder = useReplays((store) => store.loadFolder);
  const toggleFolder = useReplays((store) => store.toggleFolder);
  const currentFolder = useReplays((store) => store.currentFolder);
  const hasChildren = subdirectories.length > 0;
  const onClick = async () => {
    console.log(`loading directory: ${name}`);
    loadDirectoryList(fullPath);
    loadFolder(fullPath);
  };
  return (
    <OuterFolder>
      <div style={{ display: "flex", whiteSpace: "nowrap" }}>
        {!hasChildren ? (
          <div style={{ padding: 5, cursor: "pointer" }} onClick={onClick}>
            o
          </div>
        ) : (
          <div
            onClick={() => toggleFolder(fullPath)}
            style={{ padding: 5, cursor: "pointer" }}
          >
            {collapsed ? "v" : "^"}
          </div>
        )}
        <div
          onClick={onClick}
          style={{
            cursor: "pointer",
            marginLeft: 10,
            fontWeight: currentFolder === fullPath ? "bold" : "normal",
            opacity: currentFolder === fullPath ? 1 : 0.5,
          }}
        >
          {name}
        </div>
      </div>
      {collapsed
        ? null
        : subdirectories.map((f) => (
            <ChildFolder key={f.fullPath}>
              <FolderTreeNode {...f} />
            </ChildFolder>
          ))}
    </OuterFolder>
  );
};
