import { css } from "@emotion/react";
import styled from "@emotion/styled";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { DualPane } from "@/components/dual_pane";
import { BasicFooter } from "@/components/footer/footer";
import { LabelledText } from "@/components/labelled_text";
import { IconMessage } from "@/components/message";
import { useDolphinActions } from "@/lib/dolphin/use_dolphin_actions";
import { useDelayedLoading } from "@/lib/hooks/use_delayed_loading";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/use_replay_browser_list";
import { buildReplayFilters, useReplayFilter } from "@/lib/hooks/use_replay_filter";
import { useReplayPresenter, useReplays, useReplaySelection } from "@/lib/hooks/use_replays";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";
import { colors } from "@/styles/colors";

import { FileList } from "./file_list/file_list";
import { FileListSkeleton } from "./file_list/file_list_skeleton";
import { FileSelectionToolbar } from "./file_selection_toolbar/file_selection_toolbar";
import { FilterToolbar } from "./filter_toolbar/filter_toolbar";
import { FolderTreeNode } from "./folder_tree_node";
import { ReplayBrowserMessages as Messages } from "./replay_browser.messages";

export const ReplayBrowser = React.memo(() => {
  const presenter = useReplayPresenter();
  const searchInputRef = React.createRef<HTMLInputElement>();
  const { dolphinService, replayService } = useServices();
  const { viewReplays } = useDolphinActions(dolphinService);

  const loading = useReplays((store) => store.loading);
  const replayProgress = useReplays((store) => store.progress);
  const loadingMore = useReplays((store) => store.loadingMore);
  const hasMoreReplays = useReplays((store) => store.hasMoreReplays);
  const showReplayProgress = React.useMemo(
    () => replayProgress && replayProgress.current !== replayProgress.total,
    [replayProgress],
  );
  const replayProgressPercent = React.useMemo(() => {
    if (replayProgress) {
      return Math.round((replayProgress.current / replayProgress.total) * 100);
    } else {
      return undefined;
    }
  }, [replayProgress]);

  const currentFolder = useReplays((store) => store.currentFolder);
  const folderTree = useReplays((store) => store.folderTree);
  const collapsedFolders = useReplays((store) => store.collapsedFolders);
  const totalFilesInFolder = useReplays((store) => store.totalFilesInFolder);

  const selectedFiles = useReplays((store) => store.selectedFiles);
  const selectAllMode = useReplays((store) => store.selectAllMode);
  const deselectedFiles = useReplays((store) => store.deselectedFiles);

  // Convert to Set for O(1) lookups in list items
  const selectedFilesSet = React.useMemo(() => new Set(selectedFiles), [selectedFiles]);

  const showLoading = useDelayedLoading(loading, 300, 500);
  const fileSelection = useReplaySelection();
  const { showError, showSuccess } = useToasts();

  const resetFilter = useReplayFilter((store) => store.resetFilter);
  const { files: filteredFiles } = useReplayBrowserList();
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

  const deleteReplays = React.useCallback(
    (fileIds: string[]) => {
      replayService
        .deleteReplays(fileIds)
        .then(() => {
          // Don't optimistically remove the files in the UI since it could trigger an
          // infinite scroll and fetch more data, _before_ we can delete the files from the DB.
          presenter.removeFilesByIds(fileIds);
          showSuccess(Messages.filesDeleted(fileIds.length));
        })
        .catch(showError);
    },
    [presenter, showError, showSuccess, replayService],
  );

  const handlePlayAll = React.useCallback(async () => {
    try {
      if (selectAllMode) {
        // Get all file paths from the current folder with the same filters
        const { sortBy, sortDirection, hideShortGames, searchText } = useReplayFilter.getState();
        const filters = buildReplayFilters(hideShortGames, searchText);
        const allFilePaths = await replayService.getAllFilePaths({
          folderPath: currentFolder,
          orderBy: {
            field: sortBy === "DATE" ? "startTime" : "lastFrame",
            direction: sortDirection === "DESC" ? "desc" : "asc",
          },
          filters,
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
        // Use bulk delete with filters
        const { hideShortGames, searchText } = useReplayFilter.getState();
        const filters = buildReplayFilters(hideShortGames, searchText);
        const result = await replayService.bulkDeleteReplays({
          folderPath: currentFolder,
          filters,
          excludeFilePaths: deselectedFiles,
        });

        // Reload the folder to get the updated list
        await presenter.loadFolder(currentFolder, true);
        showSuccess(Messages.filesDeleted(result.deletedCount));
      } else {
        // Just delete the selected files - map file paths to file IDs
        const fileIds = filteredFiles.filter((file) => selectedFiles.includes(file.fullPath)).map((file) => file.id);
        await deleteReplays(fileIds);
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
    deleteReplays,
    fileSelection,
    showError,
    showSuccess,
    filteredFiles,
    presenter,
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
              <FilterToolbar ref={searchInputRef} />
              {showLoading ? (
                <FileListSkeleton />
              ) : filteredFiles.length === 0 ? (
                <EmptyFolder
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
                  onDelete={(filePath) => {
                    const file = filteredFiles.find((f) => f.fullPath === filePath);
                    if (file) {
                      deleteReplays([file.id]);
                    }
                  }}
                  onFileClick={fileSelection.onFileClick}
                  selectedFiles={selectedFiles}
                  selectedFilesSet={selectedFilesSet}
                  onSelect={(index: number) => setSelectedItem(index)}
                  onPlay={(index: number) => playSelectedFile(index)}
                  files={filteredFiles}
                  onLoadMore={handleLoadMore}
                  loadingMore={loadingMore}
                  hasMoreReplays={hasMoreReplays}
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
        <div
          css={css`
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 1em;
          `}
        >
          {showLoading ? (
            <>
              <span>
                {showReplayProgress
                  ? Messages.processedReplayCount(replayProgress!.current, replayProgress!.total)
                  : ""}
              </span>
              <CircularProgress
                color="secondary"
                size={20}
                value={replayProgressPercent}
                variant={replayProgressPercent ? "determinate" : "indeterminate"}
              />
            </>
          ) : (
            Messages.totalReplayCount(totalFilesInFolder ?? filteredFiles.length)
          )}
        </div>
      </Footer>
    </Outer>
  );
});

const EmptyFolder = ({ onClearFilter }: { onClearFilter: () => void }) => {
  return (
    <IconMessage Icon={SearchIcon} label={Messages.noSlpFilesFound()}>
      <div style={{ textAlign: "center" }}>
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
