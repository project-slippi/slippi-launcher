import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

export interface StartGameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const StartGameDialog: React.FC<StartGameDialogProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onClose();
    onSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
      fullWidth={true}
      fullScreen={fullScreen}
    >
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle>You are not logged in</StyledDialogTitle>
        <DialogContent style={{ display: "flex" }}>
          <div>Only logged in users can play online. Would you like to play offline?</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button color="primary" type="submit">
            Play offline
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
