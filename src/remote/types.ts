export type SpectateRemoteService = {
  onSpectateRemoteServerStateChange(
    handle: (state: { connected: boolean; started: boolean; port?: number }) => void,
  ): () => void;
  startSpectateRemoteServer(authToken: string, port?: number): Promise<{ success: boolean; err?: string }>;
  stopSpectateRemoteServer(): Promise<void>;
};
