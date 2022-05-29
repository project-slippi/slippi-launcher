import React from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { useDolphinActions } from "@/lib/dolphin/useDolphinActions";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/useReplayBrowserList";
import { useReplays } from "@/lib/hooks/useReplays";
import { useServices } from "@/services";

import { ReplayFileStats } from "../ReplayFileStats";
import { ReplayBrowser } from "./ReplayBrowser";

export const ReplayBrowserPage: React.FC = () => {
  const { lastPath } = useReplayBrowserNavigation();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="list" element={<ReplayBrowser />} />
      <Route path=":filePath" element={<ChildPage goBack={() => navigate("..")} />} />
      <Route path="*" element={<Navigate replace to={lastPath} />} />
    </Routes>
  );
};

const ChildPage: React.FC<{ goBack: () => void }> = () => {
  const { filePath } = useParams<Record<string, any>>();
  const selectedFile = useReplays((store) => store.selectedFile);
  const decodedFilePath = decodeURIComponent(filePath);
  const { dolphinService } = useServices();
  const { viewReplays } = useDolphinActions(dolphinService);
  const nav = useReplayBrowserList();
  const { goToReplayList } = useReplayBrowserNavigation();

  const onPlay = () => {
    viewReplays({ path: decodedFilePath });
  };

  return (
    <ReplayFileStats
      filePath={decodedFilePath}
      file={selectedFile.fileResult ?? undefined}
      index={nav.index}
      total={nav.total}
      onNext={nav.selectNextFile}
      onPrev={nav.selectPrevFile}
      onClose={goToReplayList}
      onPlay={onPlay}
    />
  );
};
