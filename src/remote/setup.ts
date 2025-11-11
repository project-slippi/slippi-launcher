import type { SpectateController } from "@broadcast/types";
import type { DolphinManager } from "@dolphin/manager";
import type { SettingsManager } from "@settings/settings_manager";

import { ipc_startSpectateRemoteServer, ipc_stopSpectateRemoteServer } from "./ipc";
import { SpectateRemoteServer } from "./spectate_remote_server";

export default function setupRemoteIpc({
  dolphinManager,
  settingsManager,
  getSpectateController,
}: {
  dolphinManager: DolphinManager;
  settingsManager: SettingsManager;
  getSpectateController: () => Promise<SpectateController>;
}) {
  const remoteServer = new SpectateRemoteServer(dolphinManager, settingsManager, getSpectateController);
  ipc_startSpectateRemoteServer.main!.handle(async ({ authToken, port }) => {
    return await remoteServer.start(authToken, port);
  });
  ipc_stopSpectateRemoteServer.main!.handle(async () => {
    remoteServer.stop();
    return { success: true };
  });
}
