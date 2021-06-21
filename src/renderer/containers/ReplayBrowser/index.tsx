/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import FolderIcon from "@material-ui/icons/Folder";
import SearchIcon from "@material-ui/icons/Search";
import { colors } from "common/colors";
import { shell } from "electron";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { BasicFooter } from "@/components/BasicFooter";
import { DualPane } from "@/components/DualPane";
import { LoadingScreen } from "@/components/LoadingScreen";
import { IconMessage } from "@/components/Message";
import { useReplayFilter } from "@/lib/hooks/useReplayFilter";
import { useSettings } from "@/lib/hooks/useSettings";
import { replayFileFilter, replayFileSort } from "@/lib/replayFileSort";
import { useReplays } from "@/store/replays";
import { withFont } from "@/styles/withFont";

import { ReplayFileStats } from "../ReplayFileStats";
import { FileList } from "./FileList";
import { FileSelectionToolbar } from "./FileSelectionToolbar";
import { FilterToolbar } from "./FilterToolbar";
import { FolderTreeNode } from "./FolderTreeNode";

export const ReplayBrowser: React.FC = () => {
  const searchInputRef = React.createRef<HTMLInputElement>();
  const scrollRowItem = useReplays((store) => store.scrollRowItem);
  const setScrollRowItem = useReplays((store) => store.setScrollRowItem);
  const removeFile = useReplays((store) => store.removeFile);
  const files = useReplays((store) => store.files);
  const selectedItem = useReplays((store) => store.selectedFile.index);
  const selectFile = useReplays((store) => store.selectFile);
  const playFile = useReplays((store) => store.playFile);
  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const loading = useReplays((store) => store.loading);
  const currentFolder = useReplays((store) => store.currentFolder);
  const folders = useReplays((store) => store.folders);
  const selectedFiles = useReplays((store) => store.selectedFiles);
  const toggleSelectedFiles = useReplays((store) => store.toggleSelectedFiles);
  const clearSelectedFiles = useReplays((store) => store.clearSelectedFiles);
  const init = useReplays((store) => store.init);
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const { addToast } = useToasts();

  const sortDirection = useReplayFilter((store) => store.sortDirection);
  const sortBy = useReplayFilter((store) => store.sortBy);
  const searchText = useReplayFilter((store) => store.searchText);
  const hideShortGames = useReplayFilter((store) => store.hideShortGames);
  const resetFilter = useReplayFilter((store) => store.resetFilter);
  const filteredFiles = files
    .filter(replayFileFilter({ searchText, hideShortGames }))
    .sort(replayFileSort(sortBy, sortDirection));
  const numHiddenFiles = files.length - filteredFiles.length;

  React.useEffect(() => {
    init(rootSlpPath);
  }, [rootSlpPath, init]);

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      clearSelectedFile();
    } else {
      const filePath = filteredFiles[index].fullPath;
      selectFile(index, filePath);
    }
  };

  const playSelectedFile = (index: number) => {
    const filePath = filteredFiles[index].fullPath;
    playFile(filePath);
  };

  const deleteFiles = (filePaths: string[]) => {
    let errCount = 0;
    filePaths.forEach((filePath) => {
      const success = shell.moveItemToTrash(filePath);
      if (success) {
        // Remove the file from the store
        removeFile(filePath);
      } else {
        errCount += 1;
      }
    });

    let message = `${filePaths.length - errCount} file(s) deleted successfully.`;
    if (errCount > 0) {
      message += ` ${errCount} file(s) couldn't be deleted.`;
    }
    addToast(message, { appearance: "success", autoDismiss: true });
  };

  if (folders === null) {
    return null;
  }

  return (
    <Outer>
      {selectedItem !== null ? (
        <ReplayFileStats
          index={selectedItem}
          total={filteredFiles.length}
          file={filteredFiles[selectedItem]}
          onNext={() => setSelectedItem(Math.min(filteredFiles.length - 1, selectedItem + 1))}
          onPrev={() => setSelectedItem(Math.max(0, selectedItem - 1))}
          onClose={() => setSelectedItem(null)}
        />
      ) : (
        <React.Fragment>
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
              leftStyle={{ backgroundColor: "rgba(0,0,0, 0.3)" }}
              leftSide={
                <List dense={true} style={{ flex: 1, padding: 0 }}>
                  <div style={{ position: "relative", minHeight: "100%" }}>
                    <FolderTreeNode {...folders} />
                    {loading && (
                      <div
                        style={{
                          position: "absolute",
                          height: "100%",
                          width: "100%",
                          top: 0,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                        }}
                      />
                    )}
                  </div>
                </List>
              }
              rightSide={
                <div
                  css={css`
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                  `}
                >
                  <FilterToolbar disabled={loading} ref={searchInputRef} />
                  {loading ? (
                    <LoadingBox />
                  ) : filteredFiles.length === 0 ? (
                    <EmptyFolder
                      hiddenFileCount={numHiddenFiles}
                      onClearFilter={() => {
                        if (searchInputRef.current) {
                          searchInputRef.current.value = "";
                        }
                        resetFilter();
                      }}
                    />
                  ) : (
                    <FileList
                      folderPath={currentFolder}
                      onDelete={(filePath) => deleteFiles([filePath])}
                      handleAddToList={(filePath: string) => toggleSelectedFiles(filePath)}
                      selectedFiles={selectedFiles}
                      onSelect={(index: number) => setSelectedItem(index)}
                      onPlay={(index: number) => playSelectedFile(index)}
                      files={filteredFiles}
                      scrollRowItem={scrollRowItem}
                      setScrollRowItem={setScrollRowItem}
                    />
                  )}
                  <FileSelectionToolbar
                    totalSelected={selectedFiles.length}
                    onPlay={() => null}
                    onClear={clearSelectedFiles}
                    onDelete={() => {
                      deleteFiles(selectedFiles);
                      clearSelectedFiles();
                    }}
                  />
                </div>
              }
            />
          </div>

          <Footer>
            <div
              css={css`
                display: flex;
                align-items: center;
              `}
            >
              <div>
                <Tooltip title="Reveal location">
                  <IconButton onClick={() => shell.openItem(currentFolder)} size="small">
                    <FolderIcon
                      css={css`
                        color: ${colors.purpleLight};
                      `}
                    />
                  </IconButton>
                </Tooltip>
              </div>
              <div
                css={css`
                  display: flex;
                  flex-direction: column;
                  margin-left: 10px;
                  padding-right: 20px;
                `}
              >
                <div
                  css={css`
                    font-size: 11px;
                    font-weight: bold;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    font-family: ${withFont("Maven Pro")};
                  `}
                >
                  Current folder
                </div>
                <div
                  css={css`
                    color: white;
                    font-weight: lighter;
                  `}
                >
                  {currentFolder}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {filteredFiles.length} files found. {numHiddenFiles} files filtered.{" "}
              {fileErrorCount > 0 ? `${fileErrorCount} files had errors.` : ""}
            </div>
          </Footer>
        </React.Fragment>
      )}
    </Outer>
  );
};

const LoadingBox: React.FC = () => {
  const progress = useReplays((store) => store.progress);
  let message = "Loading...";
  if (progress !== null) {
    message += ` ${Math.floor((progress.current / progress.total) * 100)}%`;
  }
  return <LoadingScreen message={message} />;
};

const EmptyFolder: React.FC<{
  hiddenFileCount: number;
  onClearFilter: () => void;
}> = ({ hiddenFileCount, onClearFilter }) => {
  const classes = useStyles();
  return (
    <IconMessage Icon={SearchIcon} label="No SLP files found">
      {hiddenFileCount > 0 && (
        <div style={{ textAlign: "center" }}>
          <Typography style={{ marginTop: 20, opacity: 0.6 }}>{hiddenFileCount} files hidden</Typography>
          <Button className={classes.label} color="primary" onClick={onClearFilter} size="small">
            clear filter
          </Button>
        </div>
      )}
    </IconMessage>
  );
};

const useStyles = makeStyles(() =>
  createStyles({
    label: {
      textTransform: "lowercase",
      fontSize: 12,
    },
  }),
);

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

const Footer = styled(BasicFooter)`
  justify-content: space-between;
`;
