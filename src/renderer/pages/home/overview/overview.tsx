import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";

import { DualPane } from "@/components/dual_pane";
import { colors } from "@/styles/colors";

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

export const HomeOverview = React.memo(function HomeOverview() {
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
            <Main>
              <div>foo bar baz</div>
            </Main>
          }
          rightSide={<Sidebar />}
          rightStyle={{ backgroundColor: colors.purpleDark }}
          style={{ gridTemplateColumns: "auto 300px" }}
        />
      </div>
    </Outer>
  );
});
