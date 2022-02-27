/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Collapse from "@material-ui/core/Collapse";
import Alert from "@material-ui/lab/Alert";
import React from "react";
import type { ToastProps } from "react-toast-notifications";

// The appearance prop matches one the severity types: 'error' | 'info' | 'success' | 'warning'
export const CustomToast: React.ComponentType<ToastProps> = ({ appearance, children, onDismiss, transitionState }) => {
  return (
    <Collapse in={transitionState === "entered"} mountOnEnter unmountOnExit>
      <Alert
        variant="standard"
        severity={appearance}
        onClose={() => onDismiss()}
        css={css`
          margin-bottom: 5px;
          max-width: 500px;
        `}
      >
        {children}
      </Alert>
    </Collapse>
  );
};
