import styled from "@emotion/styled";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { AuthGuard } from "@/components/auth_guard";
import { VerifyEmailForm } from "@/components/verify_email_form/verify_email_form";

import { HeaderMessages as Messages } from "./header.messages";

type VerifyEmailDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function VerifyEmailDialog({ open, onClose }: VerifyEmailDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} fullScreen={fullScreen}>
      <StyledDialogTitle>{Messages.verifyYourEmail()}</StyledDialogTitle>
      <DialogContent style={{ display: "flex", paddingBottom: 30 }}>
        <AuthGuard render={(user) => <VerifyEmailForm user={user} />} />
      </DialogContent>
    </Dialog>
  );
}

const StyledDialogTitle = styled(DialogTitle)`
  h2 {
    display: flex;
    align-items: center;
  }
`;
