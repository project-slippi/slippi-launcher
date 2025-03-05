/* eslint-disable import/no-default-export */
import { appVersion } from "@common/constants";

import createAuthClient from "./auth/auth.service";
import createDolphinClient from "./dolphin/dolphin.service";
import createNotificationClient from "./notification/notification.service";
import createReplayClient from "./replay/replay.service";
import createSlippiClient from "./slippi/slippi.service";
import type { Services } from "./types";

const isDevelopment = window.electron.bootstrap.isDevelopment;

export async function installServices(): Promise<Services> {
  const dolphinService = createDolphinClient();
  const authService = createAuthClient();
  const replayService = createReplayClient();
  const slippiBackendService = createSlippiClient(
    authService,
    dolphinService,
    `${appVersion}${isDevelopment ? "-dev" : ""}`,
  );
  const notificationService = createNotificationClient();

  const broadcastService = window.electron.broadcast;
  const consoleService = window.electron.console;
  const remoteService = window.electron.remote;

  return {
    authService,
    slippiBackendService,
    dolphinService,
    broadcastService,
    consoleService,
    replayService,
    remoteService,
    notificationService,
  };
}
