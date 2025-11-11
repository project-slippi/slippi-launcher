/* eslint-disable import/no-default-export */
import { appVersion } from "@common/constants";

import { useAppStore } from "@/lib/hooks/use_app_store";

import createAuthClient from "./auth/auth.service";
import createDolphinClient from "./dolphin/dolphin.service";
import createI18nService from "./i18n/i18n.service";
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
  const spectateRemoteService = window.electron.remote;

  const i18nService = createI18nService({ isDevelopment });
  // Connect i18n service to global app state for language changes
  i18nService.onLanguageChange((language) => {
    useAppStore.getState().setCurrentLanguage(language);
  });

  await i18nService.init();

  return {
    authService,
    slippiBackendService,
    dolphinService,
    broadcastService,
    consoleService,
    replayService,
    spectateRemoteService,
    notificationService,
    i18nService,
  };
}
