import { useSnackbar } from "notistack";
import React from "react";

export const useToasts = () => {
  const { enqueueSnackbar } = useSnackbar();
  const toastHandlers = React.useMemo(
    () => ({
      showError: (error: Error | string | unknown) => {
        let message: string;
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === "string") {
          message = error;
        } else {
          message = JSON.stringify(error);
        }
        // Let's not automatically hide error messages
        enqueueSnackbar(message, { variant: "error", persist: true });
      },
      showSuccess: (message: string) => enqueueSnackbar(message, { variant: "success", autoHideDuration: 2500 }),
      showWarning: (message: string) => enqueueSnackbar(message, { variant: "warning" }),
      showInfo: (message: string) => enqueueSnackbar(message, { variant: "info" }),
    }),
    [enqueueSnackbar],
  );
  return toastHandlers;
};
