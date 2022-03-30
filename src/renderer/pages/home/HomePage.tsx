import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import { DualPane } from "@/components/DualPane";
import { Footer } from "@/components/Footer";

import { NewsFeedContainer } from "./news_feed/NewsFeedContainer";
import { TwitterFeed } from "./TwitterFeed";

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

export const HomePage = React.memo(function HomePage() {
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
          leftSide={<NewsFeedContainer />}
          rightSide={<TwitterFeed />}
          rightStyle={{ backgroundColor: colors.purpleDark }}
          style={{ gridTemplateColumns: "auto 300px" }}
        />
      </div>
      <Footer />
    </Outer>
  );
});
