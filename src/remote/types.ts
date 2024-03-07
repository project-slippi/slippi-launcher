export type RemoteService = {
  onReconnect(handle: () => void): () => void;
  startRemoteServer(authToken: string): Promise<{ port: number }>;
  reconnectRemoteServer(authToken: string): Promise<{ success: boolean }>;
  stopRemoteServer(): Promise<void>;
};
