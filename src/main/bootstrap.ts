import { app } from "electron";
import log from "electron-log";
import os from "os";
import osName from "os-name";

import type { ConfigFlags } from "./flags/flags";

export type AppBootstrap = {
  operatingSystem: string;
  flags: ConfigFlags;
  isDevelopment: boolean;
  isMac: boolean;
  isLinux: boolean;
  isWindows: boolean;
  locale: string;
};

export function getAppBootstrap(flags: ConfigFlags): AppBootstrap {
  let release = os.release();
  try {
    const name = osName(os.platform(), release);
    release = `${name} (${release})`;
  } catch (err) {
    log.error(err);
  }

  const bootstrap: AppBootstrap = {
    operatingSystem: release,
    flags,
    isDevelopment: process.env.NODE_ENV !== "production",
    isMac: process.platform === "darwin",
    isLinux: process.platform === "linux",
    isWindows: process.platform === "win32",
    locale: app.getLocale(),
  };
  return bootstrap;
}
