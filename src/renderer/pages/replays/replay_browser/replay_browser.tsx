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

import { DualPane } from "@/components/dual_pane";
import { BasicFooter } from "@/components/footer/footer";
import { LabelledText } from "@/components/labelled_text";
import { LoadingScreenWithProgress } from "@/components/loading_screen/loading_screen";
import { IconMessage } from "@/components/message";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/use_replay_browser_list";
import { useReplayFilter } from "@/lib/hooks/use_replay_filter";
import { useReplayPresenter, useReplays, useReplaySelection } from "@/lib/hooks/use_replays";
import { useToasts } from "@/lib/hooks/use_toasts";
import { humanReadableBytes } from "@/lib/utils";
import { useServices } from "@/services";
import { colors } from "@/styles/colors";

import { FileList } from "./file_list/file_list";
import { FileSelectionToolbar } from "./file_selection_toolbar/file_selection_toolbar";
import { FilterToolbar } from "./filter_toolbar/filter_toolbar";
import { FolderTreeNode } from "./folder_tree_node";
import { ReplayBrowserMessages as Messages } from "./replay_browser.messages";

export const ReplayBrowser = React.memo(() => {
  const presenter = useReplayPresenter();
  const searchInputRef = React.createRef<HTMLInputElement>();
  const scrollRowItem = useReplays((store) => store.scrollRowItem);
  const { dolphinService, replayService } = useServices();
  const { viewReplays } = useDolphinActions(dolphinService);
  const loading = useReplays((store) => store.loading);
  const loadingMore = useReplays((store) => store.loadingMore);
  const hasMoreReplays = useReplays((store) => store.hasMoreReplays);
  const currentFolder = useReplays((store) => store.currentFolder);
  const folderTree = useReplays((store) => store.folderTree);
  const collapsedFolders = useReplays((store) => store.collapsedFolders);
  const selectedFiles = useReplays((store) => store.selectedFiles);
  const selectAllMode = useReplays((store) => store.selectAllMode);
  const deselectedFiles = useReplays((store) => store.deselectedFiles);
  const totalFilesInFolder = useReplays((store) => store.totalFilesInFolder);
  const totalBytes = useReplays((store) => store.totalBytes);
  const fileSelection = useReplaySelection();
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const { showError, showSuccess } = useToasts();

  const resetFilter = useReplayFilter((store) => store.resetFilter);
  const { files: filteredFiles, hiddenFileCount } = useReplayBrowserList();
  const { goToReplayStatsPage } = useReplayBrowserNavigation();

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      void presenter.clearSelectedFile();
    } else {
      const file = filteredFiles[index];
      void presenter.selectFile(file, index, filteredFiles.length);
      goToReplayStatsPage(file.fullPath);
    }
  };

  const onFolderTreeNodeClick = (fullPath: string) => {
    presenter.loadFolder(fullPath).catch(showError);
  };

  const playSelectedFile = (index: number) => {
    const filePath = filteredFiles[index].fullPath;
    viewReplays({ path: filePath });
  };

  const handleLoadMore = React.useCallback(() => {
    if (!loadingMore && hasMoreReplays) {
      presenter.loadMoreReplays().catch(showError);
    }
  }, [presenter, loadingMore, hasMoreReplays, showError]);

  const deleteFiles = React.useCallback(
    (filePaths: string[]) => {
      // Optimistically remove the files first
      presenter.removeFiles(filePaths);

      window.electron.common
        .deleteFiles(filePaths)
        .then(() => {
          showSuccess(Messages.filesDeleted(filePaths.length));
          // Reload the folder to resync the database and remove deleted files
          return presenter.loadFolder(currentFolder, true);
        })
        .catch(showError);
    },
    [presenter, showError, showSuccess, currentFolder],
  );

  const handlePlayAll = React.useCallback(async () => {
    try {
      if (selectAllMode) {
        // Get all file paths from the current folder with the same filters
        const { sortBy, sortDirection, hideShortGames } = useReplayFilter.getState();
        const allFilePaths = await replayService.getAllFilePaths(currentFolder, {
          orderBy: {
            field: sortBy === "DATE" ? "startTime" : "lastFrame",
            direction: sortDirection === "DESC" ? "desc" : "asc",
          },
          hideShortGames,
        });

        // Filter out deselected files
        const deselectedSet = new Set(deselectedFiles);
        const filesToPlay = allFilePaths.filter((path) => !deselectedSet.has(path));

        // Preserve order: manually selected files first, then remaining files
        const manuallySelectedSet = new Set(selectedFiles);
        const manuallySelected = filesToPlay.filter((path) => manuallySelectedSet.has(path));
        const remainingFiles = filesToPlay.filter((path) => !manuallySelectedSet.has(path));
        const orderedPaths = [...manuallySelected, ...remainingFiles];

        viewReplays(...orderedPaths.map((path) => ({ path })));
      } else {
        // Just play the selected files
        viewReplays(...selectedFiles.map((path) => ({ path })));
      }
    } catch (err) {
      showError(err);
    }
  }, [selectAllMode, selectedFiles, deselectedFiles, currentFolder, replayService, viewReplays, showError]);

  const handleDeleteAll = React.useCallback(async () => {
    try {
      fileSelection.clearSelection();

      if (selectAllMode) {
        // Get all file paths from the current folder with the same filters
        const { sortBy, sortDirection, hideShortGames } = useReplayFilter.getState();
        const allFilePaths = await replayService.getAllFilePaths(currentFolder, {
          orderBy: {
            field: sortBy === "DATE" ? "startTime" : "lastFrame",
            direction: sortDirection === "DESC" ? "desc" : "asc",
          },
          hideShortGames,
        });

        // Filter out deselected files
        const deselectedSet = new Set(deselectedFiles);
        const filesToDelete = allFilePaths.filter((path) => !deselectedSet.has(path));

        // Preserve order: manually selected files first, then remaining files
        const manuallySelectedSet = new Set(selectedFiles);
        const manuallySelected = filesToDelete.filter((path) => manuallySelectedSet.has(path));
        const remainingFiles = filesToDelete.filter((path) => !manuallySelectedSet.has(path));
        const orderedPaths = [...manuallySelected, ...remainingFiles];

        await deleteFiles(orderedPaths);
      } else {
        // Just delete the selected files
        await deleteFiles(selectedFiles);
      }
    } catch (err) {
      showError(err);
    }
  }, [
    selectAllMode,
    selectedFiles,
    deselectedFiles,
    currentFolder,
    replayService,
    deleteFiles,
    fileSelection,
    showError,
  ]);

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
                      onToggle={(folder) => presenter.toggleFolder(folder)}
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
                  setScrollRowItem={(item) => presenter.setScrollRowItem(item)}
                  onLoadMore={handleLoadMore}
                  loadingMore={loadingMore}
                />
              )}
              <FileSelectionToolbar
                totalSelected={
                  selectAllMode && totalFilesInFolder
                    ? totalFilesInFolder - deselectedFiles.length
                    : selectedFiles.length
                }
                isSelectAllMode={selectAllMode}
                onSelectAll={fileSelection.selectAll}
                onPlay={handlePlayAll}
                onClear={fileSelection.clearSelection}
                onDelete={handleDeleteAll}
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
            <Tooltip title={Messages.revealLocation()}>
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
            label={Messages.currentFolder()}
            css={css`
              margin-left: 10px;
            `}
          >
            {currentFolder}
          </LabelledText>
        </div>
        <div style={{ textAlign: "right" }}>
          {Messages.totalFileCount(filteredFiles.length)} {Messages.filteredFileCount(hiddenFileCount)}{" "}
          {fileErrorCount > 0 ? Messages.errorFileCount(fileErrorCount) : ""}
          {exists(totalBytes) ? Messages.totalSize(humanReadableBytes(totalBytes)) : ""}
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
    <IconMessage Icon={SearchIcon} label={Messages.noSlpFilesFound()}>
      {hiddenFileCount > 0 && (
        <div style={{ textAlign: "center" }}>
          <Typography style={{ marginTop: 20, opacity: 0.6 }}>{Messages.hiddenFileCount(hiddenFileCount)}</Typography>
          <Button
            css={css`
              text-transform: lowercase;
              font-size: 12px;
            `}
            color="primary"
            onClick={onClearFilter}
            size="small"
          >
            {Messages.clearFilter()}
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
