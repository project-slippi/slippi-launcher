import React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import { useReplays } from "@/store/replays";
import { ReplayFile } from "./ReplayFile";

export const FileList: React.FC = () => {
  const files = useReplays((store) => store.files);
  const loading = useReplays((store) => store.loading);
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const progress = useReplays((store) => store.progress);
  if (loading) {
    if (progress === null) {
      return null;
    }
    return (
      <div>
        Loading... {Math.round((progress.current / progress.total) * 100)}%
      </div>
    );
  }
  const Row = (props: { style: React.CSSProperties; index: number }) => (
    <div style={props.style}>
      <ReplayFile {...files[props.index]} />
    </div>
  );
  return (
    <div
      style={{ display: "flex", flexFlow: "column", height: "100%", flex: "1" }}
    >
      <div>
        {files.length} files found.{" "}
        {fileErrorCount > 0 ? `${fileErrorCount} files had errors.` : ""}
      </div>
      <div style={{ flex: "1", overflow: "auto" }}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={files.length}
              itemSize={60}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};
