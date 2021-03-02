import { ipcRenderer as ipc } from "electron-better-ipc";
import React from "react";
import { useQuery } from "react-query";
import styled from "styled-components";

import { DualPane } from "@/components/DualPane";

import { MediumFeed } from "./MediumFeed";

const Outer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
`;

export const Home: React.FC = () => {
  const mediumFeedQuery = useQuery(["medium-articles"], () => ipc.callMain<never, any>("fetchMediumFeed"));
  if (mediumFeedQuery.isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <Outer>
      <DualPane
        id="home-page"
        leftSide={<MediumFeed />}
        rightSide={<div>twitter feed</div>}
        style={{ gridTemplateColumns: "auto 300px" }}
      />
    </Outer>
  );
};
