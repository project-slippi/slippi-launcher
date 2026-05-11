import styled from "@emotion/styled";
import React from "react";
import { useParams } from "react-router-dom";

import { Footer } from "@/components/footer/footer";

import { HomePageMessages as Messages } from "./home_page.messages";
import { useHasUnreadNews } from "./news_feed/news_dual_pane/news_read_store";
import { NewsFeed } from "./news_feed/news_feed";
import { HomeOverview } from "./overview/overview";
import { Tabs } from "./tabs/tabs";
import { UpcomingTournaments } from "./upcoming_tournaments/upcoming_tournaments";
import { useHomeNavigation, useHomePageStore } from "./use_home_page";

const enum TabId {
  OVERVIEW = "overview",
  LATEST_NEWS = "news",
  UPCOMING_TOURNAMENTS = "tournaments",
}

const VALID_TABS = [TabId.OVERVIEW, TabId.LATEST_NEWS, TabId.UPCOMING_TOURNAMENTS] as const;

const Outer = styled.div`
  display: flex;
  flex-flow: column;
  flex: 1;
  position: relative;
  min-width: 0;
`;

export const HomePage = React.memo(function HomePage() {
  const { tab, newsId } = useParams<{ tab?: string; newsId?: string }>();
  const { handleTabChange, handleNewsIdChange } = useHomeNavigation();
  const lastSelectedTab = useHomePageStore((state) => state.lastSelectedTab);
  const lastSelectedNewsId = useHomePageStore((state) => state.lastSelectedNewsId);

  const hasValidTab = VALID_TABS.includes(tab as TabId);

  React.useEffect(() => {
    if (!hasValidTab) {
      handleTabChange(lastSelectedTab, lastSelectedTab === "news" ? lastSelectedNewsId ?? undefined : undefined);
    }
  }, [hasValidTab, lastSelectedTab, lastSelectedNewsId, handleTabChange]);

  const currentTab = hasValidTab ? (tab as TabId) : lastSelectedTab;

  const onTabChange = (newTab: string) => {
    handleTabChange(newTab as TabId);
  };

  const hasUnreadNews = useHasUnreadNews();
  const activeNewsId = tab === TabId.LATEST_NEWS ? newsId ?? lastSelectedNewsId : null;

  return (
    <Outer>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Tabs
          value={currentTab}
          onChange={onTabChange}
          highlightedTabIds={hasUnreadNews ? [TabId.LATEST_NEWS] : []}
          tabs={[
            { id: TabId.OVERVIEW, label: Messages.overview(), content: <HomeOverview /> },
            {
              id: TabId.LATEST_NEWS,
              label: Messages.latestNews(),
              content: <NewsFeed newsId={activeNewsId} onNewsIdChange={handleNewsIdChange} />,
            },
            { id: TabId.UPCOMING_TOURNAMENTS, label: Messages.upcomingTournaments(), content: <UpcomingTournaments /> },
          ]}
        />
      </div>
      <Footer />
    </Outer>
  );
});
