export const RosettaInstallDialogMessages = {
  dialogTitle: () => "Rosetta Required",
  description: () => "Slippi Dolphin requires Rosetta 2 on Apple Silicon Macs. Would you like to install it now?",
  installing: () => "Installing... This may take a few minutes.",
  installFailed: (errorCode: string) =>
    `Rosetta installation failed (error code {0}). You may need to install it manually.`,
  installSuccess: () => "Rosetta installation completed successfully.",
  cancel: () => "Cancel",
  install: () => "Install",
  done: () => "Done",
};
