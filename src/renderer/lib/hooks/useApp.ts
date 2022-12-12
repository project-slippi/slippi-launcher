import { DolphinLaunchType } from "@dolphin/types";
import create from "zustand";
import { combine } from "zustand/middleware";

import { useAccount } from "@/lib/hooks/useAccount";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";

import { useDesktopApp } from "./useQuickStart";

const log = window.electron.log;

export const useAppStore = create(
  combine(
    {
      initializing: false,
      initialized: false,
      updateVersion: "",
      updateDownloadProgress: 0,
      updateReady: false,
    },
    (set) => ({
      setInitializing: (initializing: boolean) => set({ initializing }),
      setInitialized: (initialized: boolean) => set({ initialized }),
      setUpdateVersion: (updateVersion: string) => set({ updateVersion }),
      setUpdateDownloadProgress: (updateDownloadProgress: number) => set({ updateDownloadProgress }),
      setUpdateReady: (updateReady: boolean) => set({ updateReady }),
    }),
  ),
);

export const useAppInitialization = () => {
  const { authService, slippiBackendService, dolphinService } = useServices();
  const { showError } = useToasts();
  const initializing = useAppStore((store) => store.initializing);
  const initialized = useAppStore((store) => store.initialized);
  const setInitializing = useAppStore((store) => store.setInitializing);
  const setInitialized = useAppStore((store) => store.setInitialized);
  const setUserData = useAccount((store) => store.setUserData);
  const setUser = useAccount((store) => store.setUser);
  const setServerError = useAccount((store) => store.setServerError);
  const setDesktopAppExists = useDesktopApp((store) => store.setExists);
  const setDesktopAppDolphinPath = useDesktopApp((store) => store.setDolphinPath);

  const initialize = async () => {
    if (initializing || initialized) {
      return;
    }

    setInitializing(true);

    log.info("Initializing app...");

    const promises: Promise<void>[] = [];

    // If we're logged in, check they have a valid play key
    promises.push(
      (async () => {
        let user: AuthUser | null = null;
        try {
          user = await authService.init();
          setUser(user);
        } catch (err) {
          log.warn(err);
        }

        if (user) {
          try {
            const userData = await slippiBackendService.fetchUserData();
            setServerError(false);
            setUserData(userData);
          } catch (err) {
            setServerError(true);
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

    promises.push(
      dolphinService
        .checkDesktopAppDolphin()
        .then(({ exists, dolphinPath }) => {
          setDesktopAppExists(exists);
          setDesktopAppDolphinPath(dolphinPath);
        })
        .catch(log.error),
    );

    // Check if there is an update to the launcher
    promises.push(window.electron.common.checkForAppUpdates());

    // Wait for all the promises to complete before completing
    try {
      await Promise.all(promises);
    } catch (err) {
      log.error(err);
    } finally {
      setInitialized(true);
    }
  };

  return initialize;
};
