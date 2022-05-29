import { colors } from "@common/colors";
import { exists } from "@common/exists";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";

import { DualPane } from "@/components/DualPane";
import { BasicFooter } from "@/components/Footer";
import { LabelledText } from "@/components/LabelledText";
import { LoadingScreenWithProgress } from "@/components/LoadingScreen";
import { IconMessage } from "@/components/Message";
import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/useReplayBrowserList";
import { useReplayFilter } from "@/lib/hooks/useReplayFilter";
import { useReplays, useReplaySelection } from "@/lib/hooks/useReplays";
import { useToasts } from "@/lib/hooks/useToasts";
import { humanReadableBytes } from "@/lib/utils";
import { useServices } from "@/services";

import { FileList } from "./FileList";
import { FileSelectionToolbar } from "./FileSelectionToolbar";
import { FilterToolbar } from "./FilterToolbar";
import { FolderTreeNode } from "./FolderTreeNode";

export const ReplayBrowser: React.FC = () => {
  const searchInputRef = React.createRef<HTMLInputElement>();
  const scrollRowItem = useReplays((store) => store.scrollRowItem);
  const setScrollRowItem = useReplays((store) => store.setScrollRowItem);
  const removeFiles = useReplays((store) => store.removeFiles);
  const selectFile = useReplays((store) => store.selectFile);
  const { dolphinService } = useServices();
  const { viewReplays } = useDolphinActions(dolphinService);
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
  const { showError, showSuccess } = useToasts();

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
    loadFolder(fullPath).catch(showError);
  };

  const playSelectedFile = (index: number) => {
    const filePath = filteredFiles[index].fullPath;
    viewReplays({ path: filePath });
  };

  const deleteFiles = React.useCallback(
    (filePaths: string[]) => {
      // Optimistically remove the files first
      removeFiles(filePaths);

      window.electron.common
        .deleteFiles(filePaths)
        .then(() => {
          showSuccess(`${filePaths.length} file(s) successfully deleted.`);
        })
        .catch(showError);
    },
    [showError, showSuccess, removeFiles],
  );

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
                onPlay={() => viewReplays(...selectedFiles.map((path) => ({ path })))}
                onClear={fileSelection.clearSelection}
                onDelete={() => {
                  fileSelection.clearSelection();
                  void deleteFiles(selectedFiles);
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

const LoadingBox = React.memo(function LoadingBox() {
  const progress = useReplays((store) => store.progress);
  return <LoadingScreenWithProgress current={progress?.current} total={progress?.total} />;
});

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
