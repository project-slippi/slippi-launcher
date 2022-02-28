import { useLocation, useNavigate } from "react-router-dom";
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
  const open = (modalPage?: string) => {
    setLastPage(location.pathname);
    navigate(modalPage || lastModalPage || "/settings");
  };

  const close = () => {
    setLastModalPage(location.pathname);
    navigate(lastPage || "/");
  };

  return {
    open,
    close,
  };
};
