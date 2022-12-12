import styled from "@emotion/styled";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { useUserData } from "@/lib/hooks/useAccount";
import { useToasts } from "@/lib/hooks/useToasts";

import { ActivateOnlineForm } from "../ActivateOnlineForm";

export interface ActivateOnlineDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const ActivateOnlineDialog: React.FC<ActivateOnlineDialogProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const refreshUserData = useUserData();
  const { showError } = useToasts();

  const handleSubmit = () => {
    refreshUserData()
      .then(() => {
        onClose();
        onSubmit();
      })
      .catch(showError);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} fullScreen={fullScreen}>
      <StyledDialogTitle>Choose a connect code</StyledDialogTitle>
      <DialogContent style={{ display: "flex", paddingBottom: 30 }}>
        <ActivateOnlineForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
};

const StyledDialogTitle = styled(DialogTitle)`
  h2 {
    display: flex;
    align-items: center;
  }
`;
