import Alert from "@mui/material/Alert";
import type { CustomContentProps } from "notistack";
import { SnackbarContent, SnackbarProvider, useSnackbar } from "notistack";
import React, { forwardRef, memo } from "react";

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

const CustomToast = memo(CustomSnackbarContent);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SnackbarProvider
      maxSnack={3}
      preventDuplicate={true}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      Components={{
        default: CustomToast,
        info: CustomToast,
        success: CustomToast,
        error: CustomToast,
        warning: CustomToast,
      }}
      TransitionProps={{
        direction: "up",
        mountOnEnter: true,
        unmountOnExit: true,
      }}
    >
      {children}
    </SnackbarProvider>
  );
};
