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
        enqueueSnackbar(message, { variant: "error" });
      },
      showSuccess: (message: string) => enqueueSnackbar(message, { variant: "success" }),
      showWarning: (message: string) => enqueueSnackbar(message, { variant: "warning" }),
      showInfo: (message: string) => enqueueSnackbar(message, { variant: "info" }),
    }),
    [enqueueSnackbar],
  );
  return toastHandlers;
};
