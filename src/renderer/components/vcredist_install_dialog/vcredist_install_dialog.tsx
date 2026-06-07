import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";
import { useServices } from "@/services";

import { VcRedistInstallDialogMessages as Messages } from "./vcredist_install_dialog.messages";

export const VcRedistInstallDialog = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const open = useAppStore((state) => state.isVcRedistDialogOpen);
  const { dolphinService } = useServices();

  const [installing, setInstalling] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; exitCode?: number } | null>(null);

  const handleClose = () => {
    if (installing) {
      return;
    }
    setResult(null);
    useAppStore.getState().setVcRedistDialogOpen(false);
  };

  const handleInstall = async () => {
    setInstalling(true);
    setResult(null);
    try {
      const { exitCode } = await dolphinService.installVcRedist();
      setResult({ success: exitCode === 0, exitCode });
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
        {installing && <p>{Messages.installing()}</p>}
        {result && !result.success && <p>{Messages.installFailed(`${result.exitCode ?? "unknown"}`)}</p>}
        {result && result.success && <p>{Messages.installSuccess()}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={installing}>
          {Messages.cancel()}
        </Button>
        {!result?.success && (
          <Button onClick={handleInstall} color="primary" disabled={installing}>
            {Messages.install()}
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
