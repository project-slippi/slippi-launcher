import { useModalStore } from "@/store/modal";
import { useHistory, useLocation } from "react-router-dom";

export const useModal = (modalPath: string, rootPath = "/") => {
  const lastModalPage = useModalStore((store) => store.lastModalPage);
  const lastPage = useModalStore((store) => store.lastPage);
  const setLastPage = useModalStore((store) => store.setLastPage);
  const setLastModalPage = useModalStore((store) => store.setLastModalPage);
  const history = useHistory();
  const location = useLocation();
  const open = () => {
    setLastPage(location.pathname);
    history.push(lastModalPage || modalPath);
  };

  const close = () => {
    setLastModalPage(location.pathname);
    history.push(lastPage || rootPath);
  };

  return {
    open,
    close,
  };
};
