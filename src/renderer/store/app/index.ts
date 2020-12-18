import { assertDolphinInstallation } from "@/lib/downloadDolphin";
import firebase from "firebase";
import create from "zustand";
import log from "electron-log";
import { useSettings } from "../settings";

type StoreState = {
  initialized: boolean;
  user: firebase.User | null;
  logMessage: string;
};

type StoreReducers = {
  initialize: () => Promise<void>;
  setUser: (user: firebase.User | null) => void;
};

const initialState: StoreState = {
  initialized: false,
  user: null,
  logMessage: "",
};

export const useApp = create<StoreState & StoreReducers>((set) => ({
  // Set the initial state
  ...initialState,

  // Reducers
  initialize: async () => {
    console.log("someone called 'app.initialize' function");
    const promises: Promise<void>[] = [];
    // Download Dolphin if necessary
    promises.push(
      assertDolphinInstallation((message) => {
        log.info(message);
        set({ logMessage: message });
      }).catch((err) => {
        log.error(err);
        set({ logMessage: err.message });
      })
    );

    // If there's an ISO path already set then verify the ISO
    const settingsState = useSettings.getState();
    const currentIsoPath = settingsState.settings.isoPath;
    if (currentIsoPath !== null) {
      // We have an iso path that we should probably validate
      console.log(`starting iso verification: ${currentIsoPath}`);
      promises.push(
        settingsState
          .verifyIsoPath(currentIsoPath)
          .then((res) => {
            console.log("finishede verifying iso", res);
          })
          .catch(log.error)
      );
    }

    await Promise.all(promises);
    set({ initialized: true });
  },
  setUser: (user) => {
    set({ user });
  },
}));
