import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { create } from "zustand";

const useStore = create<{ lastPage: string }>(() => ({
  lastPage: "/",
}));

export function useLastPageTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith("/settings")) {
      useStore.setState({ lastPage: location.pathname });
    }
  }, [location.pathname]);
}

export function useLastPage() {
  return useStore((s) => s.lastPage);
}
