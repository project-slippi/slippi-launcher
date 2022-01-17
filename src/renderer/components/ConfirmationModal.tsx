import styled from "@emotion/styled";
import Button, { ButtonProps } from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import React, { useCallback } from "react";

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  closeOnSubmit?: boolean;
  confirmText?: React.ReactNode;
  confirmProps?: ButtonProps;
  cancelText?: React.ReactNode;
  cancelProps?: ButtonProps;
  fullWidth?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmProps,
  cancelProps,
  closeOnSubmit = true,
  fullWidth = true,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("submitting form...");
      onSubmit();
      if (closeOnSubmit) {
        onClose();
      }
    },
    [closeOnSubmit, onClose, onSubmit],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth={fullWidth} fullScreen={fullScreen}>
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle id="responsive-dialog-title">{title}</StyledDialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary" {...cancelProps}>
            {cancelText}
          </Button>
          <Button color="primary" type="submit" {...confirmProps}>
            {confirmText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const StyledDialogTitle = styled(DialogTitle)`
  h2 {
    display: flex;
    align-items: center;
  }
`;
