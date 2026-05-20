import { useCallback } from "react";
import { useLocation, useMatch, useNavigate, useResolvedPath } from "react-router-dom";
import { create } from "zustand";

type StoreState = {
  lastPage: string;
};

type StoreReducers = {
  setLastPage: (page: string) => void;
};

const initialState: StoreState = {
  lastPage: "/",
};

const useModalStore = create<StoreState & StoreReducers>((set) => ({
  ...initialState,
  setLastPage: (page) => {
    set({ lastPage: page });
  },
}));

export const useSettingsModal = () => {
  const lastPage = useModalStore((store) => store.lastPage);
  const setLastPage = useModalStore((store) => store.setLastPage);
  const navigate = useNavigate();
  const location = useLocation();
  const resolved = useResolvedPath("/settings/*");
  const match = useMatch({ path: resolved.pathname });
  const isOpen = match != null;

  const open = useCallback(
    (modalPage?: string) => {
      if (!isOpen) {
        setLastPage(location.pathname);
      }
      const nextPage = modalPage || "/settings";
      navigate(nextPage, { replace: true });
    },
    [setLastPage, navigate, isOpen, location.pathname],
  );

  const close = useCallback(() => {
    const nextPage = lastPage || "/";
    navigate(nextPage);
  }, [navigate, lastPage]);

  return {
    isOpen,
    open,
    close,
  };
};
