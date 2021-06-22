import React from "react";
import { Redirect, Route, Switch, useHistory, useParams, useRouteMatch } from "react-router-dom";

import { useReplayBrowserList } from "@/lib/hooks/useReplayBrowserList";
import { useReplays } from "@/store/replays";

import { ReplayFileStats } from "../ReplayFileStats";
import { ReplayBrowser } from "./ReplayBrowser";

export const ReplayBrowserPage: React.FC = () => {
  const { path } = useRouteMatch();
  const history = useHistory();

  return (
    <Switch>
      <Route path={`${path}/list`}>
        <ReplayBrowser path={path} />
      </Route>
      <Route path={`${path}/:filePath`}>
        <ChildPage goBack={() => history.push(path)} parent={path} />
      </Route>
      <Route exact path={path}>
        <Redirect to={`${path}/list`} />
      </Route>
    </Switch>
  );
};

const ChildPage: React.FC<{ parent: string; goBack: () => void }> = ({ parent, goBack }) => {
  const { filePath } = useParams<Record<string, any>>();
  const selectedFile = useReplays((store) => store.selectedFile);
  const playFiles = useReplays((store) => store.playFiles);
  const nav = useReplayBrowserList(parent);

  const onPlay = () => {
    playFiles([{ path: filePath }]);
  };

  return (
    <ReplayFileStats
      filePath={filePath}
      file={selectedFile.fileResult ?? undefined}
      index={nav.index}
      total={nav.total}
      onNext={nav.selectNextFile}
      onPrev={nav.selectPrevFile}
      onClose={goBack}
      onPlay={onPlay}
    />
  );
};
