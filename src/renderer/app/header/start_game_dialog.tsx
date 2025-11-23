import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { HeaderMessages as Messages } from "./header.messages";

type StartGameDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export const StartGameDialog = ({ open, onClose, onSubmit }: StartGameDialogProps) => {
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
        <StyledDialogTitle>{Messages.youAreNotLoggedIn()}</StyledDialogTitle>
        <DialogContent style={{ display: "flex" }}>
          <div>{Messages.onlyLoggedInUsersCanPlayOnline()}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            {Messages.cancel()}
          </Button>
          <Button color="primary" type="submit">
            {Messages.playOffline()}
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
