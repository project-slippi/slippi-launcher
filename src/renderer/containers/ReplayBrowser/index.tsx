import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { FolderResult } from "@/lib/replayBrowser";
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

const RenderFolderTree: React.FC<FolderResult> = (props) => {
  const { name, subdirectories, fullPath, collapsed } = props;
  const loadDirectoryList = useReplays((store) => store.loadDirectoryList);
  const toggleFolder = useReplays((store) => store.toggleFolder);
  const hasChildren = subdirectories.length > 0;
  const onClick = async () => {
    console.log(`loading directory: ${name}`);
    loadDirectoryList(fullPath);
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
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const [flex, setFlex] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    console.log("inside react use effect");
    loadDirectoryList(rootSlpPath);
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
        <ColumnContent>Hello world</ColumnContent>
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
