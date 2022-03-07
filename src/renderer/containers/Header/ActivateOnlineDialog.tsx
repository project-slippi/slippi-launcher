import styled from "@emotion/styled";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { useAccount } from "@/lib/hooks/useAccount";

import { ActivateOnlineForm } from "../ActivateOnlineForm";

export interface ActivateOnlineDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const ActivateOnlineDialog: React.FC<ActivateOnlineDialogProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const refreshPlayKey = useAccount((store) => store.refreshPlayKey);
  const { addToast } = useToasts();

  const handleSubmit = () => {
    refreshPlayKey()
      .then(() => {
        onClose();
        onSubmit();
      })
      .catch((err) => {
        addToast(err.message, { apperance: "error" });
      });
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
