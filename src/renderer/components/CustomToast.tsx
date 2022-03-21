import Alert from "@mui/material/Alert";
import type { CustomContentProps } from "notistack";
import { SnackbarContent, useSnackbar } from "notistack";
import { forwardRef, memo } from "react";

const CustomSnackbarContent = forwardRef<HTMLDivElement, CustomContentProps>((props, forwardedRef) => {
  const { closeSnackbar } = useSnackbar();

  const { id, message, variant } = props;

  return (
    <SnackbarContent ref={forwardedRef}>
      <Alert
        variant="standard"
        severity={variant === "default" ? "info" : variant}
        onClose={() => closeSnackbar(id)}
        sx={{
          maxWidth: 500,
          width: "100%",
        }}
      >
        {message}
      </Alert>
    </SnackbarContent>
  );
});

export const CustomToast = memo(CustomSnackbarContent);
