import React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ReplayFile } from "./ReplayFile";
import { FileResult } from "common/replayBrowser";

const FileListResults: React.FC<{
  onSelect: (index: number) => void;
  files: FileResult[];
}> = ({ files, onSelect }) => {
  const Row = (props: { style?: React.CSSProperties; index: number }) => (
    <div style={props.style}>
      <ReplayFile
        onSelect={() => onSelect(props.index)}
        {...files[props.index]}
      />
    </div>
  );

  return (
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
  );
};

export const FileList: React.FC<{
  files: FileResult[];
  onSelect: (index: number) => void;
}> = ({ files, onSelect }) => {
  return (
    <div
      style={{ display: "flex", flexFlow: "column", height: "100%", flex: "1" }}
    >
      <div style={{ flex: "1", overflow: "hidden" }}>
        <FileListResults onSelect={onSelect} files={files} />
      </div>
    </div>
  );
};
