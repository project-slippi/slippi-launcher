import { colors } from "@common/colors";
import { exists } from "@common/exists";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";
import { CircularProgress, Link } from "@mui/material";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";

import { BasicFooter } from "@/components/Footer";
import { LabelledText } from "@/components/LabelledText";
import { LoadingScreenWithProgress } from "@/components/LoadingScreen";
import { IconMessage } from "@/components/Message";
import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useGlobalStats } from "@/lib/hooks/useGlobalStats";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/useReplayBrowserList";
import { useReplayFilter } from "@/lib/hooks/useReplayFilter";
import { useReplays, useReplaySelection } from "@/lib/hooks/useReplays";
import { useToasts } from "@/lib/hooks/useToasts";
import { humanReadableBytes } from "@/lib/utils";
import { useServices } from "@/services";

import { FileList } from "./FileList";
import { FileSelectionToolbar } from "./FileSelectionToolbar";
import { FilterToolbar } from "./FilterToolbar";
import { PlayerDashboard } from "./PlayerDashboard";

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
  const selectedFiles = useReplays((store) => store.selectedFiles);
  const totalBytes = useReplays((store) => store.totalBytes);
  const fileSelection = useReplaySelection();
  const fileErrorCount = useReplays((store) => store.fileErrorCount);
  const { showError, showSuccess } = useToasts();

  const resetFilter = useReplayFilter((store) => store.resetFilter);
  const { files: filteredFiles, hiddenFileCount } = useReplayBrowserList();
  const { goToReplayStatsPage, goToGlobalStatsPage } = useReplayBrowserNavigation();

  const setSelectedItem = (index: number | null) => {
    if (index === null) {
      void clearSelectedFile();
    } else {
      const file = filteredFiles[index];
      void selectFile(file, index, filteredFiles.length);
      goToReplayStatsPage(file.fullPath);
    }
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

  const computeGlobal = useGlobalStats((store) => store.computeGlobal);
  const loadedStats = useGlobalStats((store) => store.loaded);
  console.log("loadedStats", loadedStats);
  const loadingStats = useGlobalStats((store) => store.loading);
  console.log("loadingStats", loadingStats);
  const progress = useGlobalStats((store) => store.progress);
  console.log(progress);

  return (
    <Outer>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          flex: 1;
        `}
      >
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
            {filteredFiles.length} files found -{" "}
            {hiddenFileCount > 0 ? `${hiddenFileCount} file${hiddenFileCount > 1 ? "s" : ""} filtered - ` : ""}
            {fileErrorCount > 0 ? `${fileErrorCount} files had errors - ` : ""}
            {exists(totalBytes) ? `Total size: ${humanReadableBytes(totalBytes)}` + " - " : ""}
            {!loadedStats && !loadingStats ? <Link onClick={computeGlobal}>{"Enable global stats"}</Link> : ""}
            {!loadedStats && loadingStats ? (
              <>
                Caching stats... {progress.current} / {progress.total}
                <div
                  css={css`
                    display: inline-flex;
                    vertical-align: top;
                    margin-left: 5px;
                  `}
                >
                  <CircularProgress
                    variant="determinate"
                    size={20}
                    value={(progress.current / progress.total) * 100}
                    color="primary"
                  />
                </div>
              </>
            ) : (
              ""
            )}
            {loadedStats ? <Link onClick={goToGlobalStatsPage}>{"Explore Stats"}</Link> : ""}
          </div>
        </Footer>
        <PlayerDashboard disabled={false} loadedStats={loadedStats} />
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
