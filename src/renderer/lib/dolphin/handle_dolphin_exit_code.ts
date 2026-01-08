const { isLinux, isWindows } = window.electron.bootstrap;

import { HandleDolphinExitCodeMessages as Messages } from "./handle_dolphin_exit_code.messages";

export const handleDolphinExitCode = (exitCode: number | null): string | undefined => {
  if (exitCode == null || exitCode === 0) {
    return undefined;
  }

  let err: string | undefined;

  if (isWindows) {
    err = handleWindowsExitCode(exitCode);
  }

  if (isLinux) {
    err = handleLinuxExitCode(exitCode);
  }

  return err;
};

const handleWindowsExitCode = (exitCode: number): string | undefined => {
  switch (exitCode) {
    case 0x3: {
      // returned when selecting update in game
      return undefined;
    }
    case 0xc0000135:
    case 0xc000007b: {
      return Messages.requiredDllsMissing();
    }
    case 0xc0000409: {
      return Messages.dolphinCrashed();
    }
    case 0xc0000005: {
      return Messages.tryDifferentVideoBackend();
    }
    default: {
      const errorCode = `0x${exitCode.toString(16)}`;
      return Messages.dolphinExitedWithErrorCode(errorCode);
    }
  }
};

const handleLinuxExitCode = (exitCode: number): string => {
  switch (exitCode) {
    case 0x7f: {
      return Messages.requiredLibrariesMissing();
    }
    default: {
      const errorCode = `0x${exitCode.toString(16)}`;
      return Messages.dolphinExitedWithErrorCode(errorCode);
    }
  }
};
