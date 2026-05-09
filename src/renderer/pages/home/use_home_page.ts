import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { create } from "zustand";

import type { HomeTab } from "./home_routes";
import { HOME_TABS } from "./home_routes";

const isHomeTab = (s: string | undefined): s is HomeTab => HOME_TABS.includes(s as HomeTab);

interface HomePageState {
  lastTab: HomeTab;
  subPaths: Record<string, string | null>;
  setLastTab: (tab: HomeTab) => void;
  setSubPath: (tab: string, subPath: string | null) => void;
}

export const useHomePageStore = create<HomePageState>((set) => ({
  lastTab: "overview",
  subPaths: {},
  setLastTab: (tab) => set({ lastTab: tab }),
  setSubPath: (tab, subPath) => set((s) => ({ subPaths: { ...s.subPaths, [tab]: subPath } })),
}));

export function useHomePage() {
  const navigate = useNavigate();
  const { tab: urlTab, newsId } = useParams<{ tab?: string; newsId?: string }>();
  const lastTab = useHomePageStore((s) => s.lastTab);
  const subPaths = useHomePageStore((s) => s.subPaths);
  const setLastTab = useHomePageStore((s) => s.setLastTab);
  const setSubPath = useHomePageStore((s) => s.setSubPath);

  // Redirect when URL has no valid tab
  useEffect(() => {
    if (!isHomeTab(urlTab)) {
      navigate(`/main/home/${lastTab}`, { replace: true });
    }
  }, [urlTab, lastTab, navigate]);

  // Sync URL params into the store (preserve sub-paths per tab)
  useEffect(() => {
    if (isHomeTab(urlTab)) {
      setLastTab(urlTab);
      if (urlTab === "news" && newsId) {
        setSubPath("news", newsId);
      }
    }
  }, [urlTab, newsId, setLastTab, setSubPath]);

  const currentTab: HomeTab = isHomeTab(urlTab) ? urlTab : lastTab;
  const activeNewsId = currentTab === "news" ? newsId ?? subPaths.news ?? null : null;

  return { currentTab, activeNewsId };
}
