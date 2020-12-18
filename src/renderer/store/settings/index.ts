import create from "zustand";
import electronSettings from "electron-settings";

import produce from "immer";
import { verifyISO } from "@/lib/verifyISO";
import { getDefaultRootSlpPath } from "@/lib/directories";

electronSettings.configure({
  fileName: "Settings",
  prettify: true,
});

const SETTINGS_KEY = "settings";

type StoreState = {
  // These are the settings which will get persisted into the electron-settings file
  settings: {
    isoPath: string | null;
    rootSlpPath: string;
  };
  // Other settings related values
  verifyingIso: boolean;
  validIsoPath: boolean | null;
};

type StoreReducers = {
  setIsoPath: (isoPath: string | null) => void;
  setReplayDirectory: (dir: string) => void;
  verifyIsoPath: (isoPath: string, shouldSetPath?: boolean) => Promise<void>;
};

const restored = (electronSettings.getSync(SETTINGS_KEY) as unknown) as Partial<
  StoreState["settings"]
>;

const initialState: StoreState = {
  settings: {
    isoPath: null,
    rootSlpPath: getDefaultRootSlpPath(),
    ...restored,
  },
  verifyingIso: false,
  validIsoPath: null,
};

export const useSettings = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  // Reducers
  setIsoPath: (isoPath) => {
    set((state) =>
      produce(state, (draft) => {
        draft.settings.isoPath = isoPath;
      })
    );
  },
  setReplayDirectory: (dir) => {
    set((state) =>
      produce(state, (draft) => {
        draft.settings.rootSlpPath = dir;
      })
    );
  },
  verifyIsoPath: async (isoPath, shouldSetPath) => {
    // Indicate that we're loading
    set({
      verifyingIso: true,
      validIsoPath: null,
    });

    try {
      const res = await verifyISO(isoPath);
      set({ validIsoPath: res.valid });

      // Set the path if valid
      if (shouldSetPath && res.valid) {
        const setIsoPath = get().setIsoPath;
        setIsoPath(isoPath);
      }
    } catch (err) {
      set({ validIsoPath: false });
    } finally {
      set({ verifyingIso: false });
    }
  },
}));

// Whenever we modify the settings value persist it into electron-settings
useSettings.subscribe(
  (settings: StoreState["settings"]) => {
    electronSettings.setSync(SETTINGS_KEY, settings);
  },
  (state) => state.settings
);
