import React from "react";
import { Redirect, Route, Switch, useHistory, useParams, useRouteMatch } from "react-router-dom";

import { useDolphin } from "@/lib/hooks/useDolphin";
import { useReplayBrowserList, useReplayBrowserNavigation } from "@/lib/hooks/useReplayBrowserList";
import { useReplays } from "@/lib/hooks/useReplays";

import { ReplayFileStats } from "../ReplayFileStats";
import { ReplayBrowser } from "./ReplayBrowser";

export const ReplayBrowserPage: React.FC = () => {
  const { lastPath } = useReplayBrowserNavigation();
  const { path } = useRouteMatch();
  const history = useHistory();

  return (
    <Switch>
      <Route path={`${path}/list`}>
        <ReplayBrowser />
      </Route>
      <Route path={`${path}/:filePath`}>
        <ChildPage goBack={() => history.push(path)} parent={path} />
      </Route>
      <Route exact path={path}>
        <Redirect to={lastPath} />
      </Route>
    </Switch>
  );
};

const ChildPage: React.FC<{ parent: string; goBack: () => void }> = () => {
  const { filePath } = useParams<Record<string, any>>();
  const selectedFile = useReplays((store) => store.selectedFile);
  const decodedFilePath = decodeURIComponent(filePath);
  const { viewReplays } = useDolphin();
  const nav = useReplayBrowserList();
  const { goToReplayList } = useReplayBrowserNavigation();

  const onPlay = () => {
    viewReplays([{ path: decodedFilePath }]);
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
