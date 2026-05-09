import styled from "@emotion/styled";
import React from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/footer/footer";

import { HomePageMessages as Messages } from "./home_page.messages";
import type { HomeTab } from "./home_routes";
import { HomeRoutes } from "./home_routes";
import { useHasUnreadNews } from "./news_feed/news_dual_pane/news_read_store";
import { NewsFeed } from "./news_feed/news_feed";
import { HomeOverview } from "./overview/overview";
import { Tabs } from "./tabs/tabs";
import { UpcomingTournaments } from "./upcoming_tournaments/upcoming_tournaments";
import { useHomePage, useHomePageStore } from "./use_home_page";

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

export const HomePage = React.memo(function HomePage() {
  const navigate = useNavigate();
  const { currentTab, activeNewsId } = useHomePage();
  const setSubPath = useHomePageStore((s) => s.setSubPath);
  const hasUnreadNews = useHasUnreadNews();

  return (
    <Outer>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Tabs
          value={currentTab}
          highlightedTabIds={hasUnreadNews ? ["news"] : []}
          onChange={(tab) => {
            switch (tab as HomeTab) {
              case "overview":
                navigate(HomeRoutes.overview());
                break;
              case "news":
                navigate(HomeRoutes.latestNews());
                break;
              case "tournaments":
                navigate(HomeRoutes.upcomingTournaments());
                break;
            }
          }}
          tabs={[
            { id: "overview", label: Messages.overview(), content: <HomeOverview /> },
            {
              id: "news",
              label: Messages.latestNews(),
              content: (
                <NewsFeed
                  newsId={activeNewsId}
                  onNewsIdChange={(id) => {
                    setSubPath("news", id);
                    navigate(HomeRoutes.latestNews(id ?? undefined));
                  }}
                />
              ),
            },
            { id: "tournaments", label: Messages.upcomingTournaments(), content: <UpcomingTournaments /> },
          ]}
        />
      </div>
      <Footer />
    </Outer>
  );
});
