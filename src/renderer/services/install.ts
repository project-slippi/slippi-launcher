/* eslint-disable import/no-default-export */
import { appVersion } from "@common/constants";

import createAuthClient from "./auth/auth.service";
import createSlippiClient from "./slippi/slippi.service";
import type { Services } from "./types";

const isDevelopment = window.electron.common.isDevelopment;

export async function installServices(): Promise<Services> {
  const authService = createAuthClient();
  const slippiBackendService = createSlippiClient(authService, `${appVersion}${isDevelopment ? "-dev" : ""}`);

  return {
    authService,
    slippiBackendService,
    broadcastService: window.electron.broadcast,
    consoleService: window.electron.console,
  };
}
