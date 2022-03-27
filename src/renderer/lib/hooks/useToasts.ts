import { useSnackbar } from "notistack";
import React from "react";

export const useToasts = () => {
  const { enqueueSnackbar } = useSnackbar();
  const toastHandlers = React.useMemo(
    () => ({
      showError: (message: string) => enqueueSnackbar(message, { variant: "error" }),
      showSuccess: (message: string) => enqueueSnackbar(message, { variant: "success" }),
      showWarning: (message: string) => enqueueSnackbar(message, { variant: "warning" }),
    }),
    [enqueueSnackbar],
  );
  return toastHandlers;
};
