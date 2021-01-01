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
import { LoadingScreen } from "@/components/LoadingScreen";
import { ReplayFileStats } from "../ReplayFileStats";
import List from "@material-ui/core/List";
import { colors } from "common/colors";

const initialFilters: FilterOptions = {
  tag: "",
  newestFirst: true,
  hideShortGames: true,
};

export const ReplayBrowser: React.FC = () => {
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>(
    initialFilters
  );

  const scrollRowItem = useReplays((store) => store.scrollRowItem);
  const setScrollRowItem = useReplays((store) => store.setScrollRowItem);
  const deleteFile = useReplays((store) => store.deleteFile);
  const files = useReplays((store) => store.files);
  const selectedItem = useReplays((store) => store.selectedFile.index);
  const selectFile = useReplays((store) => store.selectFile);
  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const loading = useReplays((store) => store.loading);
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

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      clearSelectedFile();
    } else {
      const filePath = filteredFiles[index].fullPath;
      selectFile(index, filePath);
    }
  };

  const updateFilter = debounce((val) => setFilterOptions(val), 100);

  if (folders === null) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        flex: "1",
        position: "relative",
      }}
    >
      {selectedItem !== null ? (
        <ReplayFileStats
          index={selectedItem}
          total={filteredFiles.length}
          file={filteredFiles[selectedItem]}
          onNext={() =>
            setSelectedItem(
              Math.min(filteredFiles.length - 1, selectedItem + 1)
            )
          }
          onPrev={() => setSelectedItem(Math.max(0, selectedItem - 1))}
          onClose={() => setSelectedItem(null)}
        />
      ) : (
        <>
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
              resizable={true}
              minWidth={0}
              maxWidth={300}
              leftSide={
                <List dense={true} style={{ flex: 1, padding: 0 }}>
                  <FolderTreeNode {...folders} />
                </List>
              }
              rightSide={
                <FileList
                  onDelete={deleteFile}
                  onSelect={(index: number) => setSelectedItem(index)}
                  files={filteredFiles}
                  scrollRowItem={scrollRowItem}
                  setScrollRowItem={setScrollRowItem}
                />
              }
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              whiteSpace: "nowrap",
              padding: 5,
              backgroundColor: colors.grayDark,
              fontSize: 14,
            }}
          >
            <div>{currentFolder}</div>
            <div style={{ textAlign: "right" }}>
              {filteredFiles.length} files found.{" "}
              {files.length - filteredFiles.length} files filtered.{" "}
              {fileErrorCount > 0 ? `${fileErrorCount} files had errors.` : ""}
            </div>
          </div>
        </>
      )}
      {loading && <LoadingBox />}
    </div>
  );
};

const LoadingBox: React.FC = () => {
  const progress = useReplays((store) => store.progress);
  let message = "Loading...";
  if (progress !== null) {
    message += ` ${Math.floor((progress.current / progress.total) * 100)}%`;
  }
  return (
    <LoadingScreen
      message={message}
      style={{
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.8)",
      }}
    />
  );
};
