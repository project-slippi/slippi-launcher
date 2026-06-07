export const VcRedistInstallDialogMessages = {
  dialogTitle: () => "Missing Required DLLs",
  description: () =>
    "Slippi Dolphin requires the Microsoft Visual C++ Redistributable. Would you like to install it now?",
  installing: () => "Installing... This may take a few minutes.",
  installFailed: (errorCode: string) => `Installation failed (error code {0}). You may need to install it manually.`,
  installSuccess: () => "Installation completed successfully. You can now relaunch Slippi Dolphin.",
  cancel: () => "Cancel",
  install: () => "Install",
  done: () => "Done",
};
