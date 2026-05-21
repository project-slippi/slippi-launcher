import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useLastPage } from "./use_last_page";

export const useSettingsModal = () => {
  const lastPage = useLastPage();
  const navigate = useNavigate();

  const open = useCallback(
    (modalPage?: string) => {
      const nextPage = modalPage || "/settings";
      navigate(nextPage, { replace: true });
    },
    [navigate],
  );

  const close = useCallback(() => {
    const nextPage = lastPage || "/";
    navigate(nextPage);
  }, [navigate, lastPage]);

  return {
    open,
    close,
  };
};
