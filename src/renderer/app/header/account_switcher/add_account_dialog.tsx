import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { LoginForm } from "@/components/login_form/login_form";

export interface AddAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddAccountDialog: React.FC<AddAccountDialogProps> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} fullScreen={fullScreen}>
      <DialogTitle>Add Another Account</DialogTitle>
      <DialogContent>
        <LoginForm onSuccess={handleSuccess} disableAutoFocus={false} />
      </DialogContent>
    </Dialog>
  );
};

