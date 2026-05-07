import React from "react";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";

type HomeTab = "overview" | "news" | "tournaments";

interface HomePageState {
  lastSelectedTab: HomeTab;
  setLastSelectedTab: (tab: HomeTab) => void;
}

export const useHomePageStore = create<HomePageState>((set) => ({
  lastSelectedTab: "overview",
  setLastSelectedTab: (tab) => set({ lastSelectedTab: tab }),
}));

export const useHomeNavigation = () => {
  const navigate = useNavigate();
  const setLastSelectedTab = useHomePageStore((state) => state.setLastSelectedTab);

  const handleTabChange = React.useCallback(
    (newTab: HomeTab) => {
      setLastSelectedTab(newTab);
      navigate(`/main/home/${newTab}`, { replace: true });
    },
    [navigate, setLastSelectedTab],
  );

  return handleTabChange;
};
