import type { SpectateController } from "@broadcast/types";
import type { DolphinManager } from "@dolphin/manager";
import type { SettingsManager } from "@settings/settings_manager";

import { ipc_startRemoteServer, ipc_stopRemoteServer } from "./ipc";
import { RemoteServer } from "./remote_server";

export default function setupRemoteIpc({
  dolphinManager,
  settingsManager,
  getSpectateController,
}: {
  dolphinManager: DolphinManager;
  settingsManager: SettingsManager;
  getSpectateController: () => Promise<SpectateController>;
}) {
  const remoteServer = new RemoteServer(dolphinManager, settingsManager, getSpectateController);
  ipc_startRemoteServer.main!.handle(async ({ authToken, port }) => {
    return await remoteServer.start(authToken, port);
  });
  ipc_stopRemoteServer.main!.handle(async () => {
    remoteServer.stop();
    return { success: true };
  });
}
