import styled from "@emotion/styled";
import React, { useCallback, useEffect } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";

import { Footer } from "@/components/footer/footer";
import { useRouteMemory } from "@/lib/hooks/use_route_memory";

import { HomePageMessages as Messages } from "./home_page.messages";
import { HOME_TABS } from "./home_routes";
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

const RestoreHomeScope = React.memo(function RestoreHomeScope() {
  const navigate = useNavigate();
  const lastTab = useRouteMemory((s) => s.routeMemory["home"]) || "overview";

  useEffect(() => {
    navigate(`/main/home/${lastTab}`, { replace: true });
  }, [lastTab, navigate]);

  return null;
});

export const HomePage = React.memo(function HomePage() {
  const params = useParams();
  const navigate = useNavigate();
  const setLastRoute = useRouteMemory((s) => s.setLastRoute);
  const hasUnreadNews = useHasUnreadNews();

  const splat = params["*"] || "";
  const firstSegment = splat.split("/")[0] || "";
  const currentTab = (HOME_TABS as readonly string[]).includes(firstSegment) ? firstSegment : undefined;

  const handleTabChange = useCallback(
    (tab: string) => {
      setLastRoute("home", tab);
      navigate(`/main/home/${tab}`);
    },
    [setLastRoute, navigate],
  );

  return (
    <Outer>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Tabs
          value={currentTab}
          highlightedTabIds={hasUnreadNews ? ["news"] : []}
          onChange={handleTabChange}
          tabs={[
            { id: "overview", label: Messages.overview() },
            { id: "news", label: Messages.latestNews() },
            { id: "tournaments", label: Messages.upcomingTournaments() },
          ]}
        />
        <Routes>
          <Route index={true} element={<RestoreHomeScope />} />
          <Route path="overview" element={<HomeOverview />} />
          <Route path="news/*" element={<NewsFeed />} />
          <Route path="tournaments" element={<UpcomingTournaments />} />
        </Routes>
      </div>
      <Footer />
    </Outer>
  );
});
