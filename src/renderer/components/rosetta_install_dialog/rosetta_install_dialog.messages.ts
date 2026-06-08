export const RosettaInstallDialogMessages = {
  dialogTitle: () => "Rosetta Required",
  description: () => "Slippi Dolphin requires Rosetta on Apple Silicon Macs. Would you like to install it now?",
  installing: () => "Installing... This may take a few minutes.",
  installFailed: (errorCode: string) =>
    `Rosetta installation failed (error code {0}). You may need to install it manually.`,
  installSuccess: () => "Installation completed successfully. You can now relaunch Slippi Dolphin.",
  cancel: () => "Cancel",
  appleLicenseDescription: () =>
    "Use of Rosetta is subject to Apple's software license agreement. A list of Apple SLAs may be found here:",
  agreeAndInstall: () => "Agree and Install",
  done: () => "Done",
};
