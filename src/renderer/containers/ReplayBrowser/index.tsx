import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { FileResult, FolderResult } from "common/replayBrowser";
import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import React from "react";
import styled from "styled-components";

const STORE_KEY = "TREE_FLEX_SIZE";

const OuterFolder = styled.div``;

const ChildFolder = styled.div`
  margin-left: 10px;
`;

const RenderFileList: React.FC = () => {
  const files = useReplays((store) => store.files);
  const loading = useReplays((store) => store.loading);
  const progress = useReplays((store) => store.progress);
  if (loading) {
    if (progress === null) {
      return null;
    }
    return (
      <div>
        Loading... {Math.round((progress.current / progress.total) * 100)}%
      </div>
    );
  }
  return (
    <div>
      {files.map((f) => (
        <RenderFile key={f.fullPath} {...f} />
      ))}
    </div>
  );
};

const RenderFile: React.FC<FileResult> = (props) => {
  return <div>{props.fullPath}</div>;
};

const RenderFolderTree: React.FC<FolderResult> = (props) => {
  const { name, subdirectories, fullPath, collapsed } = props;
  const loadDirectoryList = useReplays((store) => store.loadDirectoryList);
  const loadFolder = useReplays((store) => store.loadFolder);
  const toggleFolder = useReplays((store) => store.toggleFolder);
  const hasChildren = subdirectories.length > 0;
  const onClick = async () => {
    console.log(`loading directory: ${name}`);
    loadDirectoryList(fullPath);
    loadFolder(fullPath);
  };
  return (
    <OuterFolder>
      <div style={{ display: "flex", whiteSpace: "nowrap" }}>
        {!hasChildren ? (
          <div style={{ padding: 5, cursor: "pointer" }} onClick={onClick}>
            o
          </div>
        ) : (
          <div
            onClick={() => toggleFolder(fullPath)}
            style={{ padding: 5, cursor: "pointer" }}
          >
            {collapsed ? "v" : "^"}
          </div>
        )}
        <div onClick={onClick} style={{ cursor: "pointer", marginLeft: 10 }}>
          {name}
        </div>
      </div>
      {collapsed
        ? null
        : subdirectories.map((f) => (
            <ChildFolder key={f.fullPath}>
              <RenderFolderTree {...f} />
            </ChildFolder>
          ))}
    </OuterFolder>
  );
};

// <div style={{ display: "flex", flex: 1 }}>
//   {folders === null ? null : <RenderFolder {...folders} />}
// </div>
export const ReplayBrowser: React.FC = () => {
  const folders = useReplays((store) => store.folders);
  const loadDirectoryList = useReplays((store) => store.loadDirectoryList);
  const loadFolder = useReplays((store) => store.loadFolder);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const [flex, setFlex] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    console.log("inside react use effect");
    loadDirectoryList(rootSlpPath);
    loadFolder();
    const oldFlex = localStorage.getItem(STORE_KEY);
    setFlex(oldFlex ? +oldFlex : undefined);
  }, [rootSlpPath, loadDirectoryList, setFlex]);

  const saveFlex = (flexAmount?: number) => {
    if (flexAmount) {
      localStorage.setItem(STORE_KEY, flexAmount.toString());
    }
  };

  console.log("renderering replay browser");
  if (folders === null) {
    return null;
  }
  return (
    <ReflexContainer orientation="vertical">
      <ReflexElement
        flex={flex}
        onStopResize={({ component }) => saveFlex(component.props.flex)}
      >
        <ColumnContent>
          <RenderFolderTree {...folders} />
        </ColumnContent>
      </ReflexElement>

      <ReflexSplitter />

      <ReflexElement>
        <ColumnContent>
          <RenderFileList />
        </ColumnContent>
      </ReflexElement>
    </ReflexContainer>
  );
};

const ColumnContent = styled(OverlayScrollbarsComponent)`
  overflow: hidden;
  overflow-y: auto;
  position: relative;
  height: 100%;
  width: 100%;
`;
