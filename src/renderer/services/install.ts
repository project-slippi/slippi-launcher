/* eslint-disable import/no-default-export */
import { appVersion } from "@common/constants";

import AuthClient from "./auth/auth.service";
import SlippiBackendClient from "./slippi/slippi.service";
import type { Services } from "./types";

const isDevelopment = window.electron.common.isDevelopment;

export function installServices(): Services {
  const authService = new AuthClient();
  const slippiBackendService = new SlippiBackendClient(authService, `${appVersion}${isDevelopment ? "-dev" : ""}`);

  return {
    authService,
    slippiBackendService,
    broadcastService: window.electron.broadcast,
    consoleService: window.electron.console,
  };
}
