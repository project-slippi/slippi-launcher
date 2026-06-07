import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from "react";

import { useAppStore } from "@/lib/hooks/use_app_store";

export const InstallVcRedistDialog = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const open = useAppStore((state) => state.isVcRedistDialogOpen);

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
      const exitCode = await window.electron.dolphin.installVcRedist();
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
      <DialogTitle>Missing Required DLLs</DialogTitle>
      <DialogContent>
        <p>Slippi Dolphin requires the Microsoft Visual C++ Redistributable. Would you like to install it now?</p>
        {installing && <p>Installing... This may take a few minutes.</p>}
        {result && !result.success && (
          <p>Installation failed (error code {result.exitCode ?? "unknown"}). You may need to install it manually.</p>
        )}
        {result && result.success && <p>Installation completed successfully.</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={installing}>
          Close
        </Button>
        {!result?.success && (
          <Button onClick={handleInstall} color="primary" disabled={installing}>
            {installing ? "Installing..." : "Install"}
          </Button>
        )}
        {result?.success && (
          <Button onClick={handleClose} color="primary">
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
