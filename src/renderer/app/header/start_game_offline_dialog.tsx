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

type StartGameOfflineDialogProps = {
  open: boolean;
  onCancel: () => void;
  onPlayOffline: () => void;
};

export const StartGameOfflineDialog = ({ open, onCancel, onPlayOffline }: StartGameOfflineDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCancel();
    onPlayOffline();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          onCancel();
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
          <Button onClick={onCancel} color="secondary">
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
