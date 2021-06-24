import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
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
  const loading = useAccount((store) => store.loading);
  const { addToast } = useToasts();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    <Dialog open={open} onClose={onClose} fullWidth={true} fullScreen={fullScreen} disableBackdropClick={true}>
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle>Online play is disabled</StyledDialogTitle>
        <DialogContent style={{ display: "flex" }}>
          <ActivateOnlineForm hideRetry={true} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button color="primary" type="submit" disabled={loading}>
            Retry
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
