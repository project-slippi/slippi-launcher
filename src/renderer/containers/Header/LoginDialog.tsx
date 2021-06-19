import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import React from "react";

import { LoginForm } from "@/containers/LoginForm";
import { useLoginModal } from "@/lib/hooks/useLoginModal";

export const LoginDialog = () => {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const closeModal = useLoginModal((store) => store.closeModal);
  const loginModalOpen = useLoginModal((store) => store.open);
  return (
    <Dialog open={loginModalOpen} onClose={closeModal} fullWidth={true} fullScreen={fullScreen}>
      <DialogTitle>{isSignUp ? "Create an account" : "Log in"}</DialogTitle>
      <DialogContent>
        <LoginForm isSignUp={isSignUp} onSuccess={closeModal} toggleSignUp={() => setIsSignUp(!isSignUp)} />
      </DialogContent>
    </Dialog>
  );
};
