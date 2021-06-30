import { ipc_getDesktopAppPath } from "common/ipc";
import { ipc_dolphinDownloadFinishedEvent, ipc_downloadDolphin } from "dolphin/ipc";
import log from "electron-log";
import firebase from "firebase";
import create from "zustand";
import { combine } from "zustand/middleware";

import { initializeFirebase } from "@/lib/firebase";
import { useAccount } from "@/lib/hooks/useAccount";
import { fetchPlayKey } from "@/lib/slippiBackend";

import { useDesktopApp } from "./useQuickStart";

export const useAppStore = create(
  combine(
    {
      initialized: false,
      logMessage: "",
    },
    (set) => ({
      setInitialized: (initialized: boolean) => set({ initialized }),
      setLogMessage: (logMessage: string) => set({ logMessage }),
    }),
  ),
);

export const useAppInitialization = () => {
  const initialized = useAppStore((store) => store.initialized);
  const setInitialized = useAppStore((store) => store.setInitialized);
  const setLogMessage = useAppStore((store) => store.setLogMessage);
  const setUser = useAccount((store) => store.setUser);
  const setPlayKey = useAccount((store) => store.setPlayKey);
  const setDesktopAppExists = useDesktopApp((store) => store.setExists);
  const setDesktopAppPath = useDesktopApp((store) => store.setPath);

  const initialize = async () => {
    if (initialized) {
      console.log("App is already initialized!");
      return;
    }

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
      ipc_getDesktopAppPath
        .renderer!.trigger({})
        .then(({ result }) => {
          if (!result) {
            throw new Error("Could not get old desktop app path");
          }
          setDesktopAppExists(result.exists);
          setDesktopAppPath(result.path);
        })
        .catch(console.error),
    );

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
