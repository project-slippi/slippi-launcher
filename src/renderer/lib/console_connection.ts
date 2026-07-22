import type { MirrorConfig } from "@console/types";
import { Ports } from "@console/types";
import type { StoredConnection } from "@settings/types";

export type EditConnectionType = Omit<StoredConnection, "id">;

export const buildMirrorConfig = (connection: StoredConnection, nickname?: string): MirrorConfig => {
  const config: MirrorConfig = {
    id: connection.id,
    ipAddress: connection.ipAddress,
    port: connection.port ?? Ports.DEFAULT,
    folderPath: connection.folderPath,
    isRealtime: connection.isRealtime,
    enableRelay: connection.enableRelay,
    useNicknameFolders: connection.useNicknameFolders,
    nickname,
  };

  // Add OBS config if necessary
  if (connection.enableAutoSwitcher && connection.obsIP && connection.obsPort && connection.obsSourceName) {
    config.autoSwitcherSettings = {
      ip: connection.obsIP,
      port: connection.obsPort,
      password: connection.obsPassword,
      sourceName: connection.obsSourceName,
    };
  }

  return config;
};

export const addConsoleConnection = async (connection: EditConnectionType) => {
  await window.electron.settings.addNewConnection(connection);
};

export const editConsoleConnection = async (id: number, connection: EditConnectionType) => {
  await window.electron.settings.editConnection(id, connection);
};

export const deleteConsoleConnection = async (id: number) => {
  await window.electron.settings.deleteConnection(id);
};
