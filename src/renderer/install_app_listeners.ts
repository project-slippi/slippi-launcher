import type { BroadcastService } from "@broadcast/types";

import { useBroadcastListStore } from "./lib/hooks/use_broadcast_list";
import { useConsole } from "./lib/hooks/use_console";
import { useSettingsStore } from "./lib/hooks/use_settings";
import type { Services } from "./services/types";

export function installAppListeners(services: Services) {
  const { broadcastService } = services;

  // Subscribe to incremental setting changes to keep settings state in sync with main
  window.electron.settings.onSettingChanged((updates) => {
    useSettingsStore.getState().applyUpdates(updates);
  });

  installBroadcastListeners(broadcastService);
}

function installBroadcastListeners(broadcastService: BroadcastService) {
  broadcastService.onSlippiStatusChanged((status) => {
    useConsole.getState().setSlippiConnectionStatus(status);
  });

  broadcastService.onDolphinStatusChanged((status) => {
    useConsole.getState().setDolphinConnectionStatus(status);
  });

  broadcastService.onBroadcastErrorMessage((error) => {
    useConsole.getState().setBroadcastError(error);
  });

  // Listen to when the list of broadcasting users has changed
  broadcastService.onBroadcastListUpdated((items) => {
    useBroadcastListStore.getState().setItems(items);
  });
}
