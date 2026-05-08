import React from "react";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";

type HomeTab = "overview" | "news" | "tournaments";

interface HomePageState {
  lastSelectedTab: HomeTab;
  setLastSelectedTab: (tab: HomeTab) => void;
  lastSelectedNewsId: string | null;
  setLastSelectedNewsId: (id: string | null) => void;
}

export const useHomePageStore = create<HomePageState>((set) => ({
  lastSelectedTab: "overview",
  setLastSelectedTab: (tab) => set({ lastSelectedTab: tab }),
  lastSelectedNewsId: null,
  setLastSelectedNewsId: (id) => set({ lastSelectedNewsId: id }),
}));

export const useHomeNavigation = () => {
  const navigate = useNavigate();
  const setLastSelectedTab = useHomePageStore((state) => state.setLastSelectedTab);
  const setLastSelectedNewsId = useHomePageStore((state) => state.setLastSelectedNewsId);

  const handleTabChange = React.useCallback(
    (newTab: HomeTab, newsId?: string) => {
      setLastSelectedTab(newTab);
      if (newsId) {
        setLastSelectedNewsId(newsId);
      }
      navigate(`/main/home/${newTab}${newsId ? `/${newsId}` : ""}`, { replace: true });
    },
    [navigate, setLastSelectedTab, setLastSelectedNewsId],
  );

  const handleNewsIdChange = React.useCallback(
    (newsId: string | null) => {
      if (newsId) {
        setLastSelectedNewsId(newsId);
        navigate(`/main/home/news/${newsId}`, { replace: true });
      } else {
        setLastSelectedNewsId(null);
        navigate("/main/home/news", { replace: true });
      }
    },
    [navigate, setLastSelectedNewsId],
  );

  return { handleTabChange, handleNewsIdChange };
};
