export type RemoteService = {
  onReconnect(handle: () => void): () => void;
  onState(handle: (connected: boolean, started: boolean, port?: number) => void): () => void;
  startRemoteServer(authToken: string, port: number): Promise<{ success: boolean; err?: string }>;
  reconnectRemoteServer(authToken: string): Promise<{ success: boolean }>;
  stopRemoteServer(): Promise<void>;
};
