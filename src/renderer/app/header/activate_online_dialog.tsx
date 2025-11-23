import styled from "@emotion/styled";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { ActivateOnlineForm } from "@/components/activate_online_form/activate_online_form";
import { refreshUserData } from "@/lib/hooks/use_account";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { HeaderMessages as Messages } from "./header.messages";

type ActivateOnlineDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export const ActivateOnlineDialog = ({ open, onClose, onSubmit }: ActivateOnlineDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { showError } = useToasts();
  const { slippiBackendService } = useServices();

  const handleSubmit = () => {
    void refreshUserData(slippiBackendService)
      .then(() => {
        onClose();
        onSubmit();
      })
      .catch(showError);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} fullScreen={fullScreen}>
      <StyledDialogTitle>{Messages.chooseAConnectCode()}</StyledDialogTitle>
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
