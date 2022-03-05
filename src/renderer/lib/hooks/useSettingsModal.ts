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

const useModalStore = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  // Reducers
  setLastModalPage: (page) => {
    const { lastModalPage } = get();
    if (page !== lastModalPage) {
      set({ lastModalPage: page });
    }
  },
  setLastPage: (page) => {
    const { lastPage } = get();
    if (page !== lastPage) {
      set({ lastPage: page });
    }
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
