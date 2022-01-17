import { ipc_checkForUpdate } from "common/ipc";
import { ipc_checkDesktopAppDolphin, ipc_dolphinDownloadFinishedEvent, ipc_downloadDolphin } from "dolphin/ipc";
import electronLog from "electron-log";
import firebase from "firebase";
import create from "zustand";
import { combine } from "zustand/middleware";

import { initializeFirebase } from "@/lib/firebase";
import { useAccount } from "@/lib/hooks/useAccount";
import { fetchPlayKey } from "@/lib/slippiBackend";

import { useDesktopApp } from "./useQuickStart";

const log = electronLog.scope("useApp");

export const useAppStore = create(
  combine(
    {
      initializing: false,
      initialized: false,
      logMessage: "",
      updateVersion: "",
      updateDownloadProgress: 0,
      updateReady: false,
    },
    (set) => ({
      setInitializing: (initializing: boolean) => set({ initializing }),
      setInitialized: (initialized: boolean) => set({ initialized }),
      setLogMessage: (logMessage: string) => set({ logMessage }),
      setUpdateVersion: (updateVersion: string) => set({ updateVersion }),
      setUpdateDownloadProgress: (updateDownloadProgress: number) => set({ updateDownloadProgress }),
      setUpdateReady: (updateReady: boolean) => set({ updateReady }),
    }),
  ),
);

export const useAppInitialization = () => {
  const initializing = useAppStore((store) => store.initializing);
  const initialized = useAppStore((store) => store.initialized);
  const setInitializing = useAppStore((store) => store.setInitializing);
  const setInitialized = useAppStore((store) => store.setInitialized);
  const setLogMessage = useAppStore((store) => store.setLogMessage);
  const setUser = useAccount((store) => store.setUser);
  const setPlayKey = useAccount((store) => store.setPlayKey);
  const setDesktopAppExists = useDesktopApp((store) => store.setExists);
  const setDesktopAppDolphinPath = useDesktopApp((store) => store.setDolphinPath);

  const initialize = async () => {
    if (initializing || initialized) {
      return;
    }

    setInitializing(true);

    console.log("Initializing app...");

    // Initialize firebase first
    let user: firebase.User | null = null;
    try {
      user = await initializeFirebase();
      setUser(user);
    } catch (err) {
      console.warn(err);
    }

    const promises: Promise<any>[] = [];

    // If we're logged in, check they have a valid play key
    if (user) {
      promises.push(
        fetchPlayKey()
          .then((key) => setPlayKey(key))
          .catch((err) => {
            console.warn(err);
          }),
      );
    }

    promises.push(
      new Promise<void>((resolve) => {
        const handler = ipc_dolphinDownloadFinishedEvent.renderer!.handle(async ({ error }) => {
          // We only want to handle this event once so immediately destroy
          handler.destroy();

          if (error) {
            const errMsg = "Error occurred while downloading Dolphin";
            log.error(errMsg, error);
            setLogMessage(errMsg);
          }
          resolve();
        });
      }),
    );

    // Download Dolphin if necessary
    promises.push(ipc_downloadDolphin.renderer!.trigger({}));

    promises.push(
      ipc_checkDesktopAppDolphin
        .renderer!.trigger({})
        .then(({ result }) => {
          if (!result) {
            throw new Error("Could not get old desktop app path");
          }
          setDesktopAppExists(result.exists);
          setDesktopAppDolphinPath(result.dolphinPath);
        })
        .catch(console.error),
    );

    // Check if there is an update to the launcher
    promises.push(ipc_checkForUpdate.renderer!.trigger({}));

    // Wait for all the promises to complete before completing
    try {
      await Promise.all(promises);
    } catch (err) {
      console.error(err);
    } finally {
      setInitialized(true);
    }
  };

  return initialize;
};
