import { exists } from "@common/exists";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";

import { DualPane } from "@/components/dual_pane";
import { BasicFooter } from "@/components/footer/footer";
import { LabelledText } from "@/components/labelled_text";
import { LoadingScreenWithProgress } from "@/components/loading_screen";
import { IconMessage } from "@/components/message";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/use_replay_browser_list";
import { useReplayFilter } from "@/lib/hooks/use_replay_filter";
import { ReplayPresenter, useReplays, useReplaySelection } from "@/lib/hooks/use_replays";
import { useToasts } from "@/lib/hooks/use_toasts";
import { humanReadableBytes } from "@/lib/utils";
import { useServices } from "@/services";
import { colors } from "@/styles/colors";

import { FileList } from "./file_list";
import { FileSelectionToolbar } from "./file_selection_toolbar";
import { FilterToolbar } from "./filter_toolbar";
import { FolderTreeNode } from "./folder_tree_node";

export const ReplayBrowser = React.memo(() => {
  const { replayService } = useServices();
  const presenter = React.useRef(new ReplayPresenter(replayService));
  const searchInputRef = React.createRef<HTMLInputElement>();
  const scrollRowItem = useReplays((store) => store.scrollRowItem);
  const { dolphinService } = useServices();
  const { viewReplays } = useDolphinActions(dolphinService);
  const loading = useReplays((store) => store.loading);
  const currentFolder = useReplays((store) => store.currentFolder);
  const folderTree = useReplays((store) => store.folderTree);
  const collapsedFolders = useReplays((store) => store.collapsedFolders);
  const selectedFiles = useReplays((store) => store.selectedFiles);
  const totalBytes = useReplays((store) => store.totalBytes);
  const fileSelection = useReplaySelection();
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const { showError, showSuccess } = useToasts();

  const resetFilter = useReplayFilter((store) => store.resetFilter);
  const { files: filteredFiles, hiddenFileCount } = useReplayBrowserList();
  const { goToReplayStatsPage } = useReplayBrowserNavigation();

  const [isFolderTreeReversed, setIsFolderTreeReversed] = useState<boolean>(true);

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      void presenter.current.clearSelectedFile();
    } else {
      const file = filteredFiles[index];
      void presenter.current.selectFile(file, index, filteredFiles.length);
      goToReplayStatsPage(file.fullPath);
    }
  };

  const onFolderTreeNodeClick = (fullPath: string) => {
    presenter.current.loadFolder(fullPath).catch(showError);
  };

  const playSelectedFile = (index: number) => {
    const filePath = filteredFiles[index].fullPath;
    viewReplays({ path: filePath });
  };

  const deleteFiles = React.useCallback(
    (filePaths: string[]) => {
      // Optimistically remove the files first
      presenter.current.removeFiles(filePaths);

      window.electron.common
        .deleteFiles(filePaths)
        .then(() => {
          showSuccess(`${filePaths.length} file(s) successfully deleted.`);
        })
        .catch(showError);
    },
    [showError, showSuccess],
  );

  const onFolderTreeSortClick = () => {
    setIsFolderTreeReversed(!isFolderTreeReversed);
  };

  const folderTreeNodes = folderTree.map((folder) => {
    return (
      <FolderTreeNode
        folder={folder}
        key={folder.fullPath}
        collapsedFolders={collapsedFolders}
        isReversed={isFolderTreeReversed}
        onClick={onFolderTreeNodeClick}
        onToggle={(folder) => presenter.current.toggleFolder(folder)}
      />
    );
  });

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
                <Button
                  onClick={onFolderTreeSortClick}
                  startIcon={isFolderTreeReversed ? <ArrowDownward /> : <ArrowUpward />}
                >
                  Sort
                </Button>
                {isFolderTreeReversed ? folderTreeNodes.reverse() : folderTreeNodes}
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
                  setScrollRowItem={(item) => presenter.current.setScrollRowItem(item)}
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
});

const LoadingBox = React.memo(function LoadingBox() {
  const progress = useReplays((store) => store.progress);
  return <LoadingScreenWithProgress current={progress?.current} total={progress?.total} />;
});

const EmptyFolder = ({ hiddenFileCount, onClearFilter }: { hiddenFileCount: number; onClearFilter: () => void }) => {
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
