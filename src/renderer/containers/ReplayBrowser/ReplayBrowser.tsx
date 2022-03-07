/** @jsx jsx */
import { colors } from "@common/colors";
import { exists } from "@common/exists";
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import FolderIcon from "@material-ui/icons/Folder";
import SearchIcon from "@material-ui/icons/Search";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { DualPane } from "@/components/DualPane";
import { BasicFooter } from "@/components/Footer";
import { LabelledText } from "@/components/LabelledText";
import { LoadingScreen } from "@/components/LoadingScreen";
import { IconMessage } from "@/components/Message";
import { useDolphin } from "@/lib/hooks/useDolphin";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/useReplayBrowserList";
import { useReplayFilter } from "@/lib/hooks/useReplayFilter";
import { useReplays, useReplaySelection } from "@/lib/hooks/useReplays";
import { humanReadableBytes } from "@/lib/utils";

import { FileList } from "./FileList";
import { FileSelectionToolbar } from "./FileSelectionToolbar";
import { FilterToolbar } from "./FilterToolbar";
import { FolderTreeNode } from "./FolderTreeNode";

export const ReplayBrowser: React.FC = () => {
  const searchInputRef = React.createRef<HTMLInputElement>();
  const scrollRowItem = useReplays((store) => store.scrollRowItem);
  const setScrollRowItem = useReplays((store) => store.setScrollRowItem);
  const removeFile = useReplays((store) => store.removeFile);
  const selectFile = useReplays((store) => store.selectFile);
  const { viewReplays } = useDolphin();
  const clearSelectedFile = useReplays((store) => store.clearSelectedFile);
  const loading = useReplays((store) => store.loading);
  const currentFolder = useReplays((store) => store.currentFolder);
  const folderTree = useReplays((store) => store.folderTree);
  const loadFolder = useReplays((store) => store.loadFolder);
  const collapsedFolders = useReplays((store) => store.collapsedFolders);
  const toggleFolder = useReplays((store) => store.toggleFolder);
  const selectedFiles = useReplays((store) => store.selectedFiles);
  const totalBytes = useReplays((store) => store.totalBytes);
  const fileSelection = useReplaySelection();
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const { addToast } = useToasts();

  const resetFilter = useReplayFilter((store) => store.resetFilter);
  const { files: filteredFiles, hiddenFileCount } = useReplayBrowserList();
  const { goToReplayStatsPage } = useReplayBrowserNavigation();

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      void clearSelectedFile();
    } else {
      const file = filteredFiles[index];
      void selectFile(file, index, filteredFiles.length);
      goToReplayStatsPage(file.fullPath);
    }
  };

  const onFolderTreeNodeClick = (fullPath: string) => {
    loadFolder(fullPath).catch((err) => {
      addToast(`Error loading folder: ${err.message ?? JSON.stringify(err)}`, { appearance: "error" });
    });
  };

  const playSelectedFile = (index: number) => {
    const filePath = filteredFiles[index].fullPath;
    viewReplays([{ path: filePath }]);
  };

  const deleteFiles = (filePaths: string[]) => {
    let errCount = 0;
    filePaths.forEach((filePath) => {
      window.electron.shell
        .trashItem(filePath)
        .then(() => {
          removeFile(filePath);
        })
        .catch((err) => {
          console.warn(err);
          errCount += 1;
        });
    });

    let message = `${filePaths.length - errCount} file(s) deleted successfully.`;
    if (errCount > 0) {
      message += ` ${errCount} file(s) couldn't be deleted.`;
    }
    addToast(message, { appearance: "success", autoDismiss: true });
  };

  return (
    <Outer>
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
                {folderTree.map((folder) => {
                  return (
                    <FolderTreeNode
                      folder={folder}
                      key={folder.fullPath}
                      collapsedFolders={collapsedFolders}
                      onClick={onFolderTreeNodeClick}
                      onToggle={toggleFolder}
                    />
                  );
                })}
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
                  hiddenFileCount={hiddenFileCount}
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
                  onFileClick={fileSelection.onFileClick}
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
                onSelectAll={fileSelection.selectAll}
                onPlay={() => viewReplays(selectedFiles.map((path) => ({ path })))}
                onClear={fileSelection.clearSelection}
                onDelete={() => {
                  deleteFiles(selectedFiles);
                  fileSelection.clearSelection();
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
              <IconButton onClick={() => window.electron.shell.openPath(currentFolder)} size="small">
                <FolderIcon
                  css={css`
                    color: ${colors.purpleLight};
                  `}
                />
              </IconButton>
            </Tooltip>
          </div>
          <LabelledText
            label="Current folder"
            css={css`
              margin-left: 10px;
            `}
          >
            {currentFolder}
          </LabelledText>
        </div>
        <div style={{ textAlign: "right" }}>
          {filteredFiles.length} files found. {hiddenFileCount} files filtered.{" "}
          {fileErrorCount > 0 ? `${fileErrorCount} files had errors. ` : ""}
          {exists(totalBytes) ? `Total size: ${humanReadableBytes(totalBytes)}` : ""}
        </div>
      </Footer>
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
  return (
    <IconMessage Icon={SearchIcon} label="No SLP files found">
      {hiddenFileCount > 0 && (
        <div style={{ textAlign: "center" }}>
          <Typography style={{ marginTop: 20, opacity: 0.6 }}>{hiddenFileCount} files hidden</Typography>
          <Button
            css={css`
              text-transform: lowercase;
              font-size: 12px;
            `}
            color="primary"
            onClick={onClearFilter}
            size="small"
          >
            clear filter
          </Button>
        </div>
      )}
    </IconMessage>
  );
};

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
