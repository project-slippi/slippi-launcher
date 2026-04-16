import styled from "@emotion/styled";
import React from "react";

import { Footer } from "@/components/footer/footer";
import { Tabs } from "@/components/ui/tabs/tabs";

import { LocalTournaments } from "./local_tournaments";
import { NewsFeed } from "./news_feed/news_feed";
import { HomeOverview } from "./overview/overview";

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
      <div style={{ flex: 1 }}>
        <Tabs
          defaultTab="overview"
          tabs={[
            { id: "overview", label: "Overview", content: <HomeOverview /> },
            { id: "news", label: "News", content: <NewsFeed /> },
            { id: "local-tournaments", label: "Local Tournaments", content: <LocalTournaments /> },
          ]}
        />
      </div>
      <Footer />
    </Outer>
  );
});
