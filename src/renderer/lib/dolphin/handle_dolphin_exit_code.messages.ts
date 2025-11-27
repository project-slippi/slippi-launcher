export const HandleDolphinExitCodeMessages = {
  requiredDllsMissing: () =>
    "Required DLLs for launching Dolphin are missing. Check the Help section in the settings page to fix this issue.",
  dolphinCrashed: () =>
    'Dolphin has crashed. Please go to the Help section of the settings page, click "Copy logs", and paste them in the Slippi Discord\'s #windows-support channel with some context regarding the crash.',
  tryDifferentVideoBackend: () =>
    "Try a different video backend in Dolphin. If the issue persists, install the latest Windows update available and then restart your computer.",
  dolphinExitedWithErrorCode: (exitCode: string) =>
    "Dolphin exited with error code: {0}. " +
    "If you're in need of assistance, screenshot this and post it in a support channel in the Slippi Discord with some context regarding the crash.",
  requiredLibrariesMissing: () =>
    "Required libraries for launching Dolphin may be missing. Check the Help section in the settings page for guidance. Post in the Slippi Discord's #linux-support forum for further assistance if needed.",
};
