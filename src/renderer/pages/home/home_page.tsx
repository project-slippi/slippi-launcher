import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import { DualPane } from "@/components/dual_pane";
import { Footer } from "@/components/footer/footer";
import { usePageScrollingShortcuts } from "@/lib/hooks/use_shortcuts";
import { colors } from "@/styles/colors";

import { NewsFeed } from "./news_feed/news_feed";
import { Sidebar } from "./sidebar/sidebar";

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
              <NewsFeed />
            </Main>
          }
          rightSide={<Sidebar />}
          rightStyle={{ backgroundColor: colors.purpleDark }}
          style={{ gridTemplateColumns: "auto 300px" }}
        />
      </div>
      <Footer />
    </Outer>
  );
});
