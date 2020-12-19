import create from "zustand";
import { useHistory, useLocation } from "react-router-dom";

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
  const open = (modalPage?: string) => {
    setLastPage(location.pathname);
    history.push(modalPage || lastModalPage || "/settings");
  };

  const close = () => {
    setLastModalPage(location.pathname);
    history.push(lastPage || "/");
  };

  return {
    open,
    close,
  };
};
