import { useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
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
  const history = useHistory();
  const location = useLocation();
  const open = useCallback(
    (modalPage?: string) => {
      setLastPage(location.pathname);
      history.push(modalPage || lastModalPage || "/settings");
    },
    [history, lastModalPage, location.pathname, setLastPage],
  );

  const close = useCallback(() => {
    setLastModalPage(location.pathname);
    history.push(lastPage || "/");
  }, [history, lastPage, location.pathname, setLastModalPage]);

  return {
    open,
    close,
  };
};
