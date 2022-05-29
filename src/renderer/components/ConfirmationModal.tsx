import styled from "@emotion/styled";
import type { ButtonProps } from "@mui/material/Button";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

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
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitting form...");
    onSubmit();
    if (closeOnSubmit) {
      onClose();
    }
  };

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
