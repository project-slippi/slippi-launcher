import type { MirrorConfig } from "@console/types";
import type { StoredConnection } from "@settings/types";
import { Ports } from "@slippi/slippi-js";

export type EditConnectionType = Omit<StoredConnection, "id">;

export const addConsoleConnection = async (connection: EditConnectionType) => {
  await window.electron.settings.addNewConnection(connection);
};

export const editConsoleConnection = async (id: number, connection: EditConnectionType) => {
  await window.electron.settings.editConnection(id, connection);
};

export const deleteConsoleConnection = async (id: number) => {
  await window.electron.settings.deleteConnection(id);
};

export const connectToConsole = async (conn: StoredConnection) => {
  const config: MirrorConfig = {
    id: conn.id,
    ipAddress: conn.ipAddress,
    port: conn.port ?? Ports.DEFAULT,
    folderPath: conn.folderPath,
    isRealtime: conn.isRealtime,
    enableRelay: conn.enableRelay,
    useNicknameFolders: conn.useNicknameFolders,
  };

  // Add OBS config if necessary
  if (conn.enableAutoSwitcher && conn.obsIP && conn.obsSourceName) {
    config.autoSwitcherSettings = {
      ip: conn.obsIP,
      password: conn.obsPassword,
      sourceName: conn.obsSourceName,
    };
  }

  await window.electron.console.connectToConsoleMirror(config);
};

export const startConsoleMirror = async (ip: string) => {
  await window.electron.console.startMirroring(ip);
};

export const disconnectFromConsole = async (ip: string) => {
  await window.electron.console.disconnectFromConsole(ip);
};
