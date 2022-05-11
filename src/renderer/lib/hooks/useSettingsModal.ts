import { useCallback } from "react";
import { useLocation, useMatch, useNavigate, useResolvedPath } from "react-router-dom";
import create from "zustand";

type StoreState = {
  lastModalPage?: string;
  lastPage: string;
};

type StoreReducers = {
  setLastModalPage: (page: string) => void;
  setLastPage: (page: string) => void;
};

const initialState: StoreState = {
  lastPage: "/",
};

const useModalStore = create<StoreState & StoreReducers>((set) => ({
  // Set the initial state
  ...initialState,

  // Reducers
  setLastModalPage: (page) => {
    set({ lastModalPage: page });
  },
  setLastPage: (page) => {
    set({ lastPage: page });
  },
}));

export const useSettingsModal = () => {
  const lastModalPage = useModalStore((store) => store.lastModalPage);
  const lastPage = useModalStore((store) => store.lastPage);
  const setLastPage = useModalStore((store) => store.setLastPage);
  const setLastModalPage = useModalStore((store) => store.setLastModalPage);
  const navigate = useNavigate();
  const location = useLocation();
  const resolved = useResolvedPath("/settings/*");
  const match = useMatch({ path: resolved.pathname });
  const isOpen = match !== null;

  const open = useCallback(
    (modalPage?: string) => {
      if (!isOpen) {
        setLastPage(location.pathname);
      }
      const nextPage = modalPage || lastModalPage || "/settings";
      navigate(nextPage);
    },
    [setLastPage, navigate, isOpen, lastModalPage, location.pathname],
  );

  const close = useCallback(() => {
    setLastModalPage(location.pathname);
    const nextPage = lastPage || "/";
    navigate(nextPage);
  }, [setLastModalPage, navigate, lastPage, location.pathname]);

  return {
    isOpen,
    open,
    close,
  };
};
