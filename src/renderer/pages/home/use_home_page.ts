import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { useTabMemory } from "@/lib/hooks/use_tab_memory";
import { useTabRouter } from "@/lib/hooks/use_tab_router";

import { HOME_TABS } from "./home_routes";

export function useHomePage() {
  const { newsId: urlNewsId } = useParams<{ tab?: string; newsId?: string }>();
  const { currentTab, navigateToTab } = useTabRouter({
    contextKey: "home",
    tabs: HOME_TABS,
    defaultTab: "overview",
    basePath: "/main/home",
  });

  const tabState = useTabMemory((s) => s.tabState[`home:${currentTab}`]);
  const setTabParam = useTabMemory((s) => s.setTabParam);

  // Sync newsId from URL to memory
  useEffect(() => {
    if (currentTab === "news" && urlNewsId) {
      setTabParam("home", "news", "newsId", urlNewsId);
    }
  }, [currentTab, urlNewsId, setTabParam]);

  const activeNewsId = currentTab === "news" ? urlNewsId ?? tabState?.newsId ?? null : null;

  return { currentTab, activeNewsId, navigateToTab };
}
