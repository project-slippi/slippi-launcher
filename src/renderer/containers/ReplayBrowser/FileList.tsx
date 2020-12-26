import produce from "immer";
import { debounce } from "lodash";
import React from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import { useReplays } from "@/store/replays";
import { ReplayFile } from "./ReplayFile";
import { FileResult } from "common/replayBrowser";
import { extractAllPlayerNames, namesMatch } from "common/matchNames";

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

const sortByNew = (a: FileResult, b: FileResult) => {
  if (a === undefined || b === undefined) {
    return 1;
  }
  const aTime = a.startTime ? Date.parse(a.startTime) : 0;
  const bTime = b.startTime ? Date.parse(b.startTime) : 0;
  return bTime - aTime;
};

const sortByOld = (a: FileResult, b: FileResult) => {
  if (a === undefined || b === undefined) {
    return 1;
  }
  const aTime = a.startTime ? Date.parse(a.startTime) : 0;
  const bTime = b.startTime ? Date.parse(b.startTime) : 0;
  return aTime - bTime;
};

// const sortByP1HighestNeutralWinRatio = (a: FileResult, b: FileResult) => {
//   if (a === undefined || b === undefined) {
//     return 1;
//   }
//   return a.stats.overall[0].neutralWinRatio.ratio - b.stats.overall[0].neutralWinRatio.ratio
// }

const sortByLongestMatch = (a: FileResult, b: FileResult) => {
  if (a === undefined || b === undefined) {
    return 1;
  }
  if (a.lastFrame && b.lastFrame) {
    return b.lastFrame - a.lastFrame;
  }
  return 1;
};

interface FilterOptions {
  tag: string;
  sortingStrategy: (a: FileResult, b: FileResult) => number;
  hideShortGames: boolean;
}

const initialFilters: FilterOptions = {
  tag: "",
  sortingStrategy: sortByNew,
  hideShortGames: false,
};

const FilterToolbar: React.FC<{
  value: FilterOptions;
  onChange: (value: FilterOptions) => void;
}> = (props) => {
  const [tag, setTag] = React.useState<string>(props.value.tag);
  const [setSortStrategy] = React.useState<Function>(
    props.value.sortingStrategy
  );
  const [hideShortGames, setHideShortGames] = React.useState<boolean>(
    props.value.hideShortGames
  );
  const setNameFilter = (name: string) => {
    setTag(name);
    props.onChange(
      produce(props.value, (draft) => {
        draft.tag = name;
      })
    );
  };

  const setSortingStrategy = (
    sortingStrategy: (a: FileResult, b: FileResult) => number
  ) => {
    setSortStrategy(sortingStrategy);
    props.onChange(
      produce(props.value, (draft) => {
        draft.sortingStrategy = sortingStrategy;
      })
    );
  };

  const setShortGameFilter = (shouldHide: boolean) => {
    setHideShortGames(shouldHide);
    props.onChange(
      produce(props.value, (draft) => {
        draft.hideShortGames = shouldHide;
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
      <input
        type="radio"
        name="sort"
        onChange={() => setSortingStrategy(sortByNew)}
      />
      <label>New</label>
      <input
        type="radio"
        name="sort"
        onChange={() => setSortingStrategy(sortByOld)}
      />
      <label>Old</label>
      {/* <input type="radio" name="sort" onChange={() => setSortingStrategy(sortByP1HighestNeutralWinRatio)}/>
      <label>P1 highestKillPercent</label> */}
      <input
        type="radio"
        name="sort"
        onChange={() => setSortingStrategy(sortByLongestMatch)}
      />
      <label>longest match</label>

      <label>
        <input
          type="checkbox"
          checked={hideShortGames}
          onChange={(e) => setShortGameFilter(e.target.checked)}
        />
        <span>hide short games</span>
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
      if (filterOptions.hideShortGames) {
        if (file.lastFrame && file.lastFrame <= 30 * 60) {
          return false;
        }
      }

      const matchable = extractAllPlayerNames(file.settings, file.metadata);
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

  const updateFilter = debounce(
    (val: React.SetStateAction<FilterOptions>) => setFilterOptions(val),
    100
  );
  const filteredFiles = files
    .filter(filterFunction)
    .sort(filterOptions.sortingStrategy);
  return (
    <div
      style={{ display: "flex", flexFlow: "column", height: "100%", flex: "1" }}
    >
      <div>
        {filterOptions.tag}
        <div>
          {filteredFiles.length} files found.{" "}
          {files.length - filteredFiles.length} files filtered.{" "}
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
