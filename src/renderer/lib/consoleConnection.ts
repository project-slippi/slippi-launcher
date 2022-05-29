import type { StoredConnection } from "@settings/types";

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
