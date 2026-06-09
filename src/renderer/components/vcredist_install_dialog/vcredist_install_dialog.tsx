import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { ExternalLink as A } from "@/components/external_link";
import { useServices } from "@/services";

import { useVcRedistDialog } from "./use_vcredist_dialog";
import { VcRedistInstallDialogMessages as Messages } from "./vcredist_install_dialog.messages";
import styles from "./vcredist_install_dialog.module.css";

const VCREDIST_INSTALLER_URL = "https://aka.ms/vs/17/release/vc_redist.x64.exe";

export const VcRedistInstallDialog = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const open = useVcRedistDialog((state) => state.open);
  const { dolphinService } = useServices();

  const [installing, setInstalling] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean } | null>(null);

  const handleClose = () => {
    if (installing) {
      return;
    }
    setResult(null);
    useVcRedistDialog.getState().closeDialog();
  };

  const handleInstall = async () => {
    setInstalling(true);
    setResult(null);
    try {
      const { exitCode } = await dolphinService.installVcRedist();
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
        {result == null && <p>{Messages.description()}</p>}
        {installing && <p>{Messages.installing()}</p>}
        {result && !result.success && (
          <p className={styles.installFailedContainer}>
            <span>{Messages.installFailed()}</span>
            <A className={styles.vcredistLink} href={VCREDIST_INSTALLER_URL}>
              {VCREDIST_INSTALLER_URL}
            </A>
          </p>
        )}
        {result && result.success && <p>{Messages.installSuccess()}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={installing}>
          {Messages.close()}
        </Button>
        {result == null && (
          <Button onClick={handleInstall} color="primary" disabled={installing}>
            {Messages.install()}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
