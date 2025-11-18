import { useSettingsStore } from "./lib/hooks/use_settings";

export function installAppListeners() {
  // Subscribe to incremental setting changes to keep settings state in sync with main
  window.electron.settings.onSettingChanged((updates) => {
    useSettingsStore.getState().applyUpdates(updates);
  });
}
