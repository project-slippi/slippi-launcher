import { debounce } from "lodash";
import React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import { useReplays } from "@/store/replays";
import { ReplayFile } from "./ReplayFile";
import { FileResult } from "common/replayBrowser";
import { extractPlayerNames, namesMatch } from "common/matchNames";
import { GameStartType } from "@slippi/slippi-js";

const FileListResults: React.FC<{ files: FileResult[] }> = ({ files }) => {
  const Row = (props: { style?: React.CSSProperties; index: number }) => (
    <div style={props.style}>
      <ReplayFile {...files[props.index]} />
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

const FilterToolbar: React.FC<{
  onChange: (value: string) => void;
}> = (props) => {
  const [nameFilter, setNameFilter] = React.useState("");
  return (
    <div>
      <input
        placeholder="filter by tag or connect code"
        value={nameFilter}
        onChange={(e) => {
          setNameFilter(e.target.value);
          props.onChange(e.target.value);
        }}
      />
    </div>
  );
};

export const FileList: React.FC = () => {
  const [tags, setTags] = React.useState("");
  const files = useReplays((store) => store.files);
  const loading = useReplays((store) => store.loading);
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const progress = useReplays((store) => store.progress);
  const filterFunction = React.useCallback(
    (file: FileResult): boolean => {
      const matchable = extractPlayerNames(
        file.settings as GameStartType,
        file.metadata
      );
      if (!tags) {
        return true;
      } else if (matchable.length === 0) {
        return false;
      }
      return namesMatch([tags], matchable);
    },
    [tags]
  );

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

  const updateFilter = debounce((val) => setTags(val), 100);
  const filteredFiles = files.filter(filterFunction);
  return (
    <div
      style={{ display: "flex", flexFlow: "column", height: "100%", flex: "1" }}
    >
      <div>
        {tags}
        <div>
          {filteredFiles.length} files found.{" "}
          {fileErrorCount > 0 ? `${fileErrorCount} files had errors.` : ""}
        </div>
        <FilterToolbar onChange={(value) => updateFilter(value)} />
      </div>
      <div style={{ flex: "1", overflow: "hidden" }}>
        <FileListResults files={filteredFiles} />
      </div>
    </div>
  );
};
