/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import { colors } from "common/colors";
import React from "react";

import { DualPane } from "@/components/DualPane";

import { Footer } from "./Footer";
import { NewsFeed } from "./NewsFeed";
import { SideBar } from "./SideBar";

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

export const Home: React.FC = () => {
  return (
    <Outer>
      <div
        css={css`
          display: flex;
          flex: 1;
          position: relative;
          overflow: hidden;
        `}
      >
        <DualPane
          id="home-page"
          leftSide={<NewsFeed />}
          rightSide={<SideBar />}
          rightStyle={{ backgroundColor: colors.purpleDark }}
          style={{ gridTemplateColumns: "auto 300px" }}
        />
      </div>
      <Footer />
    </Outer>
  );
};
