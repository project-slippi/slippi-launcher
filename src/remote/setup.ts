import type { DolphinManager } from "@dolphin/manager";
import type { SettingsManager } from "@settings/settings_manager";

import { ipc_reconnectRemoteServer, ipc_startRemoteServer, ipc_stopRemoteServer } from "./ipc";
import RemoteServer from "./remote.server";

export default function setupRemoteIpc({
  dolphinManager,
  settingsManager,
}: {
  dolphinManager: DolphinManager;
  settingsManager: SettingsManager;
}) {
  const remoteServer = new RemoteServer(dolphinManager, settingsManager);
  ipc_startRemoteServer.main!.handle(async ({ authToken, port }) => {
    return await remoteServer.start(authToken, port);
  });
  ipc_reconnectRemoteServer.main!.handle(async ({ authToken }) => {
    return { success: await remoteServer.reconnect(authToken) };
  });
  ipc_stopRemoteServer.main!.handle(async () => {
    remoteServer.stop();
    return { success: true };
  });
}
