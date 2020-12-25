import produce from "immer";
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

interface FilterOptions {
  tag: string;
  newestFirst: boolean;
}

const initialFilters: FilterOptions = {
  tag: "",
  newestFirst: true,
};

const FilterToolbar: React.FC<{
  value: FilterOptions;
  onChange: (value: FilterOptions) => void;
}> = (props) => {
  const [tag, setTag] = React.useState<string>(props.value.tag);
  const [sortNewest, setSortNewest] = React.useState<boolean>(
    props.value.newestFirst
  );
  const setNameFilter = (name: string) => {
    setTag(name);
    props.onChange(
      produce(props.value, (draft) => {
        draft.tag = name;
      })
    );
  };

  const setNewest = (shouldSortByNew: boolean) => {
    setSortNewest(shouldSortByNew);
    props.onChange(
      produce(props.value, (draft) => {
        draft.newestFirst = shouldSortByNew;
      })
    );
  };

  return (
    <div>
      <input
        placeholder="filter by tag or connect code"
        value={tag}
        onChange={(e) => {
          setNameFilter(e.target.value);
        }}
      />
      <label>
        <input
          type="checkbox"
          checked={sortNewest}
          onChange={(e) => setNewest(e.target.checked)}
        />
        <span>sort by newest</span>
      </label>
    </div>
  );
};

export const FileList: React.FC = () => {
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>(
    initialFilters
  );
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
      if (!filterOptions.tag) {
        return true;
      } else if (matchable.length === 0) {
        return false;
      }
      return namesMatch([filterOptions.tag], matchable);
    },
    [filterOptions]
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

  const updateFilter = debounce((val) => setFilterOptions(val), 100);
  const filteredFiles = files.filter(filterFunction).sort((a, b) => {
    const aTime = a.startTime ? Date.parse(a.startTime) : 0;
    const bTime = b.startTime ? Date.parse(b.startTime) : 0;
    if (filterOptions.newestFirst) {
      return bTime - aTime;
    }
    return aTime - bTime;
  });
  return (
    <div
      style={{ display: "flex", flexFlow: "column", height: "100%", flex: "1" }}
    >
      <div>
        {filterOptions.tag}
        <div>
          {filteredFiles.length} files found.{" "}
          {fileErrorCount > 0 ? `${fileErrorCount} files had errors.` : ""}
        </div>
        <FilterToolbar
          value={filterOptions}
          onChange={(value) => updateFilter(value)}
        />
      </div>
      <div style={{ flex: "1", overflow: "hidden" }}>
        <FileListResults files={filteredFiles} />
      </div>
    </div>
  );
};
