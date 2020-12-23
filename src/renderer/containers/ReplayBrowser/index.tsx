import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import { ReflexContainer, ReflexSplitter, ReflexElement } from "react-reflex";
import React from "react";
import styled from "styled-components";
import { FolderTreeNode } from "./FolderTreeNode";
import { FileList } from "./FileList";

const STORE_KEY = "TREE_FLEX_SIZE";

const ColumnContent = styled(OverlayScrollbarsComponent)`
  overflow: hidden;
  overflow-y: auto;
  position: relative;
  height: 100%;
  width: 100%;
`;

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
          <FolderTreeNode {...folders} />
        </ColumnContent>
      </ReflexElement>

      <ReflexSplitter />

      <ReflexElement>
        <ColumnContent>
          <FileList />
        </ColumnContent>
      </ReflexElement>
    </ReflexContainer>
  );
};
