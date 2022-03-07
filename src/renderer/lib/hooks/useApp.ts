import type firebase from "firebase";
import { useToasts } from "react-toast-notifications";
import create from "zustand";
import { combine } from "zustand/middleware";

import { initializeFirebase } from "@/lib/firebase";
import { useAccount } from "@/lib/hooks/useAccount";
import { fetchPlayKey } from "@/lib/slippiBackend";

import { useDesktopApp } from "./useQuickStart";

const log = console;

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
  const { addToast } = useToasts();

  const initializing = useAppStore((store) => store.initializing);
  const initialized = useAppStore((store) => store.initialized);
  const setInitializing = useAppStore((store) => store.setInitializing);
  const setInitialized = useAppStore((store) => store.setInitialized);
  const setLogMessage = useAppStore((store) => store.setLogMessage);
  const setUser = useAccount((store) => store.setUser);
  const setPlayKey = useAccount((store) => store.setPlayKey);
  const setServerError = useAccount((store) => store.setServerError);
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
          .then((key) => {
            setServerError(false);
            setPlayKey(key);
          })
          .catch((err) => {
            setServerError(true);
            console.warn(err);

            const message = `Failed to communicate with Slippi servers. You either have no internet
              connection or Slippi is experiencing some downtime. Playing online may or may not work.`;
            addToast(message, {
              id: "server-communication-error",
              appearance: "error",
              autoDismiss: false,
            });
          }),
      );
    }

    promises.push(
      new Promise<void>((resolve) => {
        const destroy = window.electron.dolphin.onDolphinDownloadFinished((error) => {
          // We only want to handle this event once so immediately destroy
          destroy();

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
    promises.push(window.electron.dolphin.downloadDolphin());

    promises.push(
      window.electron.dolphin
        .checkDesktopAppDolphin()
        .then(({ exists, dolphinPath }) => {
          setDesktopAppExists(exists);
          setDesktopAppDolphinPath(dolphinPath);
        })
        .catch(console.error),
    );

    // Check if there is an update to the launcher
    promises.push(window.electron.common.checkForAppUpdates());

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
