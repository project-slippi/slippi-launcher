import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import { DualPane } from "@/components/DualPane";
import { Footer } from "@/components/Footer";
import { usePageScrollingShortcuts } from "@/lib/hooks/useShortcuts";

import { NewsFeed } from "./NewsFeed";
import { TournamentLinks } from "./TournamentLinks";
import { TwitterFeed } from "./TwitterFeed";

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-x: hidden;
  padding: 20px;
  padding-top: 0;
`;

const Right = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-x: hidden;
`;

export const HomePage = React.memo(function HomePage() {
  const mainRef = React.createRef<HTMLDivElement>();
  usePageScrollingShortcuts(mainRef);

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
          leftSide={
            <Main ref={mainRef}>
              <h1>Latest News</h1>
              <NewsFeed />
            </Main>
          }
          rightSide={
            <Right>
              <TwitterFeed />
              <TournamentLinks />
            </Right>
          }
          rightStyle={{ backgroundColor: colors.purpleDark }}
          style={{ gridTemplateColumns: "auto 300px" }}
        />
      </div>
      <Footer />
    </Outer>
  );
});
