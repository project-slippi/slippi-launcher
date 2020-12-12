import React from "react";
import settings from "electron-settings";

export enum Setting {
  ISO_PATH = "settings.isoPath",
}

export const useSetting = <T>(key: Setting) => {
  const current = (settings.getSync(key) as unknown) as T | null;
  const [value, setValue] = React.useState<T | null>(current ?? null);
  // React.useEffect(() => {
  //   setValue(res);
  // }, []);

  const setSetting = (val: T | null) => {
    // First persist into Electron settings
    settings.setSync(key, val as any);
    // Then actually set the state
    setValue(val);
  };
  return [value, setSetting] as const;
};
