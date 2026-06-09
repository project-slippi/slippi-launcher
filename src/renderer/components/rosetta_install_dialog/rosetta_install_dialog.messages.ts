export const RosettaInstallDialogMessages = {
  dialogTitle: () => "Rosetta Required",
  description: () => "Slippi Dolphin requires Rosetta on Apple Silicon Macs. Would you like to install it now?",
  installing: () => "Installing... This may take a few minutes.",
  /** @noTranslate */
  installFailed: () =>
    `Rosetta installation failed. To manually install, open the Terminal app and run "softwareupdate --install-rosetta".`,
  installSuccess: () => "Installation completed successfully. You can now relaunch Slippi Dolphin.",
  cancel: () => "Cancel",
  appleLicenseDescription: () =>
    "Use of Rosetta is subject to Apple's software license agreement. A list of Apple SLAs may be found here:",
  agreeAndInstall: () => "Agree and Install",
  done: () => "Done",
};
