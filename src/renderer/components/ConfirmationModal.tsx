import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import React from "react";

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string;
  cancelColor?: "secondary" | "inherit" | "default" | "primary";
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
  cancelColor = "secondary",
  fullWidth = true,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitting form...");
    onSubmit();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={fullWidth} fullScreen={fullScreen} disableBackdropClick={true}>
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle id="responsive-dialog-title">{title}</StyledDialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button onClick={onClose} color={cancelColor}>
            {cancelText}
          </Button>
          <Button color="primary" type="submit">
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
