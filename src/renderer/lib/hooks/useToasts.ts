import { useSnackbar } from "notistack";

export const useToasts = () => {
  const { enqueueSnackbar } = useSnackbar();
  return {
    showError: (message: string) => enqueueSnackbar(message, { variant: "error" }),
    showSuccess: (message: string) => enqueueSnackbar(message, { variant: "success" }),
    showWarning: (message: string) => enqueueSnackbar(message, { variant: "warning" }),
  };
};
