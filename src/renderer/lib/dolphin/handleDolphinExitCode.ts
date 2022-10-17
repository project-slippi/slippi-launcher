const { isLinux, isWindows } = window.electron.common;

export const handleDolphinExitCode = (exitCode: number | null): string | null => {
  if (exitCode === null || exitCode === 0) {
    return null;
  }

  let err: string | null = null;

  if (isWindows) {
    err = handleWindowsExitCode(exitCode);
  }

  if (isLinux) {
    err = handleLinuxExitCode(exitCode);
  }

  return err;
};

const handleWindowsExitCode = (exitCode: number): string | null => {
  switch (exitCode) {
    case 0x3: {
      // returned when selecting update in game
      return null;
    }
    case 0xc0000135:
    case 0xc0000409:
    case 0xc000007b: {
      return "Required DLLs for launching Dolphin are missing. Check the Help section in the settings page to fix this issue.";
    }
    case 0xc0000005: {
      return "Try a different video backend in Dolphin. If the issue persists, install the latest Windows update available and then restart your computer.";
    }
    default: {
      return `Dolphin exited with error code: 0x${exitCode.toString(16)}.
      If you're in need of assistance, screenshot this and post it in a support channel in the Slippi Discord.`;
    }
  }
};

const handleLinuxExitCode = (exitCode: number): string => {
  switch (exitCode) {
    case 0x7f: {
      return "Required libraries for launching Dolphin may be missing. Check the Help section in the settings page for guidance. Post in the Slippi Discord's linux-support channel for further assistance if needed.";
    }
    default: {
      return `Dolphin exited with error code: 0x${exitCode.toString(16)}.
      If you're in need of assistance, screenshot this and post it in a support channel in the Slippi Discord.`;
    }
  }
};
