import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { LoginForm } from "@/components/login_form/login_form";

import { AccountSwitcherMessages as Messages } from "./account_switcher.messages";

export interface AddAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmail?: string | null;
}

export const AddAccountDialog: React.FC<AddAccountDialogProps> = ({ open, onClose, onSuccess, defaultEmail }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} fullScreen={fullScreen}>
      <DialogTitle>{defaultEmail ? Messages.reAuthenticateAccount() : Messages.addAnotherAccount()}</DialogTitle>
      <DialogContent>
        <LoginForm onSuccess={handleSuccess} disableAutoFocus={false} defaultEmail={defaultEmail ?? undefined} />
      </DialogContent>
    </Dialog>
  );
};
