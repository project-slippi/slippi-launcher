import { DolphinLaunchType } from "@dolphin/types";
import log from "electron-log";

import type { AuthUser } from "@/services/auth/types";
import type { Services } from "@/services/types";

import { InitializeAppMessages as Messages } from "./initialize_app.messages";
import { generateQuickStartSteps } from "./lib/hooks/use_quick_start";
import type { UserData } from "./services/slippi/types";

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
        // useAccount.getState().setUser(user);
      } catch (err) {
        log.warn(err);
      }

      let userData: UserData | null = null;
      let serverError = false;
      if (user) {
        try {
          userData = await slippiBackendService.fetchUserData();
          serverError = false;
        } catch (err) {
          serverError = true;
          const reason = !navigator.onLine ? Messages.youAreOffline() : Messages.slippiMayBeDown();
          const message = `${Messages.failedToCommunicateWithSlippiServers()} ${reason}`;
          showError(message);
        }
      }

      // Generate the quick start steps based on the current state
      generateQuickStartSteps({ user, userData, serverError });
    })(),
  );

  // Download Dolphins if necessary
  [DolphinLaunchType.NETPLAY, DolphinLaunchType.PLAYBACK].map((dolphinType) => {
    void dolphinService.downloadDolphin(dolphinType).catch((err) => {
      log.error(err);
      const dolphinTypeName =
        dolphinType === DolphinLaunchType.NETPLAY ? Messages.netplayDolphin() : Messages.playbackDolphin();
      showError(Messages.failedToInstallDolphin(dolphinTypeName));
    });
  });

  // Check if there is an update to the launcher
  promises.push(window.electron.common.checkForAppUpdates());

  // Wait for all the promises to complete before returning
  const results = await Promise.allSettled(promises);
  results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .forEach((result) => {
      log.error(result.reason);
    });
}
