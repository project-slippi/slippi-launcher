import { debounce } from "lodash";
import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import React from "react";
import { FolderTreeNode } from "./FolderTreeNode";
import { FileList } from "./FileList";
import { DualPane } from "@/components/DualPane";
import { FilterOptions, FilterToolbar } from "./FilterToolbar";
import { FileResult } from "common/replayBrowser";
import { extractAllPlayerNames, namesMatch } from "common/matchNames";

const initialFilters: FilterOptions = {
  tag: "",
  newestFirst: true,
  hideShortGames: true,
};

export const ReplayBrowser: React.FC = () => {
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>(
    initialFilters
  );

  const files = useReplays((store) => store.files);
  const currentFolder = useReplays((store) => store.currentFolder);
  const folders = useReplays((store) => store.folders);
  const init = useReplays((store) => store.init);
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  React.useEffect(() => {
    init(rootSlpPath);
  }, [rootSlpPath, init]);

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

  const filteredFiles = files.filter(filterFunction).sort((a, b) => {
    const aTime = a.startTime ? Date.parse(a.startTime) : 0;
    const bTime = b.startTime ? Date.parse(b.startTime) : 0;
    if (filterOptions.newestFirst) {
      return bTime - aTime;
    }
    return aTime - bTime;
  });

  const updateFilter = debounce((val) => setFilterOptions(val), 100);

  if (folders === null) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexFlow: "column", flex: "1" }}>
      <FilterToolbar onChange={updateFilter} value={filterOptions} />
      <div
        style={{
          display: "flex",
          flex: "1",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DualPane
          id="replay-browser"
          minWidth={50}
          maxWidth={300}
          leftSide={<FolderTreeNode {...folders} />}
          rightSide={<FileList files={filteredFiles} />}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          whiteSpace: "nowrap",
        }}
      >
        <div>{currentFolder}</div>
        <div style={{ textAlign: "right" }}>
          {filteredFiles.length} files found.{" "}
          {files.length - filteredFiles.length} files filtered.{" "}
          {fileErrorCount > 0 ? `${fileErrorCount} files had errors.` : ""}
        </div>
      </div>
    </div>
  );
};
