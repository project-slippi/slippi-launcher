import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { ExternalLink as A } from "@/components/external_link";

import styles from "./rosetta_install_dialog.module.css";

const APPLE_SLA_URL = "https://www.apple.com/legal/sla/";

import { useServices } from "@/services";

import { RosettaInstallDialogMessages as Messages } from "./rosetta_install_dialog.messages";
import { useRosettaDialog } from "./use_rosetta_dialog";

export const RosettaInstallDialog = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const open = useRosettaDialog((state) => state.open);
  const { dolphinService } = useServices();

  const [installing, setInstalling] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean } | null>(null);

  const handleClose = () => {
    if (installing) {
      return;
    }
    setResult(null);
    useRosettaDialog.getState().closeDialog();
  };

  const handleInstall = async () => {
    setInstalling(true);
    setResult(null);
    try {
      const { exitCode } = await dolphinService.installRosetta();
      setResult({ success: exitCode === 0 });
    } catch {
      setResult({ success: false });
    }
    setInstalling(false);
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          handleClose();
        }
      }}
      fullWidth={true}
      fullScreen={fullScreen}
    >
      <DialogTitle>{Messages.dialogTitle()}</DialogTitle>
      <DialogContent>
        <p>{Messages.description()}</p>
        <p className={styles.appleSlaDescription}>
          <span>{Messages.appleLicenseDescription()}</span>
          <A className={styles.appleSlaLink} href={APPLE_SLA_URL}>
            {APPLE_SLA_URL}
          </A>
        </p>
        {installing && <p>{Messages.installing()}</p>}
        {result && !result.success && <p>{Messages.installFailed()}</p>}
        {result && result.success && <p>{Messages.installSuccess()}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={installing}>
          {Messages.cancel()}
        </Button>
        {!result?.success && (
          <Button onClick={handleInstall} color="primary" disabled={installing}>
            {Messages.agreeAndInstall()}
          </Button>
        )}
        {result?.success && (
          <Button onClick={handleClose} color="primary">
            {Messages.done()}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
