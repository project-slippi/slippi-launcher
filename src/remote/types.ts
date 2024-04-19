export type RemoteService = {
  onState(handle: (connected: boolean, started: boolean, port?: number) => void): () => void;
  startRemoteServer(authToken: string, port: number): Promise<{ success: boolean; err?: string }>;
  stopRemoteServer(): Promise<void>;
};
