import { DolphinLaunchType } from "@dolphin/types";
import log from "electron-log";

import type { AuthUser } from "@/services/auth/types";
import type { Services } from "@/services/types";

import { useAccount } from "./lib/hooks/use_account";

export async function initializeApp(services: Services) {
  const { authService, slippiBackendService, dolphinService, notificationService } = services;
  const { showError } = notificationService;

  log.info("Initializing app...");

  const promises: Promise<void>[] = [];

  // If we're logged in, check they have a valid play key
  promises.push(
    (async () => {
      let user: AuthUser | null = null;
      try {
        user = await authService.init();
        useAccount.getState().setUser(user);
      } catch (err) {
        log.warn(err);
      }

      if (user) {
        try {
          const userData = await slippiBackendService.fetchUserData();
          useAccount.getState().setServerError(false);
          useAccount.getState().setUserData(userData);
        } catch (err) {
          useAccount.getState().setServerError(true);
          log.warn(err);

          const message = `Failed to communicate with Slippi servers. You either have no internet
              connection or Slippi is experiencing some downtime. Playing online may or may not work.`;
          showError(message);
        }
      }
    })(),
  );

  // Download Dolphins if necessary
  [DolphinLaunchType.NETPLAY, DolphinLaunchType.PLAYBACK].map(async (dolphinType) => {
    return dolphinService.downloadDolphin(dolphinType).catch((err) => {
      log.error(err);
      showError(
        `Failed to install ${dolphinType} Dolphin. Try closing all Dolphin instances and restarting the launcher. Error: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
      );
    });
  });

  // Check if there is an update to the launcher
  promises.push(window.electron.common.checkForAppUpdates());

  // Wait for all the promises to complete before returning
  const results = await Promise.allSettled(promises);
  results
    .filter((result) => result.status === "rejected")
    .forEach((result) => {
      log.error(result.reason);
    });
}
