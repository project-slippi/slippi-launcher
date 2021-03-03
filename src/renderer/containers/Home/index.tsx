import React from "react";
import styled from "styled-components";

import { DualPane } from "@/components/DualPane";

import { NewsFeed } from "./NewsFeed";
import { SideBar } from "./SideBar";

const Outer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
`;

export const Home: React.FC = () => {
  return (
    <Outer>
      <DualPane
        id="home-page"
        leftStyle={{
          display: "inline-block",
        }}
        leftSide={<NewsFeed />}
        rightSide={<SideBar />}
        rightStyle={{ backgroundColor: "#222222" }}
        style={{ gridTemplateColumns: "auto 300px" }}
      />
    </Outer>
  );
};
