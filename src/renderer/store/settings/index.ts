import electronSettings from "electron-settings";
import { stat } from "fs-extra";
import { produce } from "immer";
import create from "zustand";

import { getDefaultRootSlpPath } from "@/lib/directories";
import { verifyISO } from "@/lib/verifyISO";

electronSettings.configure({
  fileName: "Settings",
  prettify: true,
});

const SETTINGS_KEY = "settings";

type StoreState = {
  // These are the settings which will get persisted into the electron-settings file
  settings: {
    isoPath: string | null;
    isoModTime: string | null;
    rootSlpPath: string;
  };
  // Other settings related values
  verifyingIso: boolean;
  validIsoPath: boolean | null;
};

type StoreReducers = {
  setIsoPath: (isoPath: string | null) => void;
  setIsoModTime: (isoModTime: string | null) => void;
  setReplayDirectory: (dir: string) => void;
  verifyIsoPath: (isoPath: string, shouldSetPath?: boolean) => Promise<void>;
};

const restored = (electronSettings.getSync(SETTINGS_KEY) as unknown) as Partial<StoreState["settings"]>;

const initialState: StoreState = {
  settings: {
    isoPath: null,
    isoModTime: null,
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
      }),
    );
  },
  setIsoModTime: (isoModTime) => {
    set((state) =>
      produce(state, (draft) => {
        draft.settings.isoModTime = isoModTime;
      }),
    );
  },
  setReplayDirectory: (dir) => {
    set((state) =>
      produce(state, (draft) => {
        draft.settings.rootSlpPath = dir;
      }),
    );
  },
  verifyIsoPath: async (isoPath) => {
    // Indicate that we're loading
    set({
      verifyingIso: true,
      validIsoPath: null,
    });

    try {
      const { settings, setIsoPath, setIsoModTime } = get();

      const storedModTime = settings.isoModTime;
      const { mtime } = await stat(isoPath);
      const currentIsoModTime = mtime.toString();
      if (storedModTime !== currentIsoModTime) {
        const res = await verifyISO(isoPath);
        set({ validIsoPath: res.valid });

        // set the iso path even if it is invalid
        setIsoPath(isoPath);

        // set the mod time since it has changed
        setIsoModTime(currentIsoModTime);
      } else {
        set({ validIsoPath: true });
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
  (state) => state.settings,
);
