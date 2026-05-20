import styled from "@emotion/styled";
import React from "react";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/footer/footer";
import { useTabMemory } from "@/lib/hooks/use_tab_memory";
import { useTabRouter } from "@/lib/hooks/use_tab_router";

import { HomePageMessages as Messages } from "./home_page.messages";
import { HOME_TABS, HomeRoutes } from "./home_routes";
import { useHasUnreadNews } from "./news_feed/news_dual_pane/news_read_store";
import { NewsFeed } from "./news_feed/news_feed";
import { HomeOverview } from "./overview/overview";
import { Tabs } from "./tabs/tabs";
import { UpcomingTournaments } from "./upcoming_tournaments/upcoming_tournaments";

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

export const HomePage = React.memo(function HomePage() {
  const navigate = useNavigate();
  const { currentTab, navigateToTab, extraParamValues } = useTabRouter({
    contextKey: "home",
    tabs: HOME_TABS,
    defaultTab: "overview",
    basePath: "/main/home",
    extraParams: { news: ["newsId"] },
  });
  const setTabParam = useTabMemory((s) => s.setTabParam);
  const hasUnreadNews = useHasUnreadNews();

  const activeNewsId = currentTab === "news" ? extraParamValues.newsId : null;

  return (
    <Outer>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Tabs
          value={currentTab}
          highlightedTabIds={hasUnreadNews ? ["news"] : []}
          onChange={(tab) => navigateToTab(tab as typeof currentTab)}
          tabs={[
            { id: "overview", label: Messages.overview(), content: <HomeOverview /> },
            {
              id: "news",
              label: Messages.latestNews(),
              content: (
                <NewsFeed
                  newsId={activeNewsId}
                  onNewsIdChange={(id) => {
                    setTabParam("home", "news", "newsId", id);
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
