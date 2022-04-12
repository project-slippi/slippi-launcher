/* eslint-disable import/no-default-export */
import { appVersion } from "@common/constants";

import createAuthClient from "./auth/auth.service";
import createDolphinClient from "./dolphin/dolphin.service";
import createSlippiClient from "./slippi/slippi.service";
import type { Services } from "./types";

const isDevelopment = window.electron.common.isDevelopment;

export async function installServices(): Promise<Services> {
  const dolphinService = createDolphinClient();
  const authService = createAuthClient();
  const slippiBackendService = createSlippiClient(
    authService,
    dolphinService,
    `${appVersion}${isDevelopment ? "-dev" : ""}`,
  );

  const broadcastService = window.electron.broadcast;
  const consoleService = window.electron.console;

  return {
    authService,
    slippiBackendService,
    dolphinService,
    broadcastService,
    consoleService,
  };
}
