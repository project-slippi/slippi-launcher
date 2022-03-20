import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { LoginForm } from "@/containers/LoginForm";
import { useLoginModal } from "@/lib/hooks/useLoginModal";

export const LoginDialog = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const closeModal = useLoginModal((store) => store.closeModal);
  const loginModalOpen = useLoginModal((store) => store.open);
  return (
    <Dialog open={loginModalOpen} onClose={closeModal} fullWidth={true} fullScreen={fullScreen}>
      <DialogContent>
        <LoginForm onSuccess={closeModal} />
      </DialogContent>
    </Dialog>
  );
};
