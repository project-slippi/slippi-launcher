import type { Observable } from "observable-fns";

// Re-export BroadcastMessageType from slippi-js for convenience
export enum BroadcastMessageType {
  CONNECT_REPLY = "connect_reply",
  GAME_EVENT = "game_event",
  START_GAME = "start_game",
  END_GAME = "end_game",
}

export type BroadcastMessage = {
  type: BroadcastMessageType;
  cursor: number;
  nextCursor: number;
  payload?: string; // Base64 encoded game data
  nick?: string;
};

export type SlippiBroadcastPayloadEvent = BroadcastMessage;

export type BroadcasterItem = {
  broadcaster: {
    name: string;
    uid: string;
  };
  id: string;
  name: string;
};

export type StartBroadcastConfig = {
  ip: string;
  port: number;
  viewerId: string;
  authToken: string;
  name?: string;
  connectionType: "console" | "dolphin";
};

export enum BroadcastEvent {
  SLIPPI_STATUS_CHANGE = "SLIPPI_STATUS_CHANGE",
  DOLPHIN_STATUS_CHANGE = "DOLPHIN_STATUS_CHANGE",
  ERROR = "ERROR",
  LOG = "LOG",
  RECONNECT = "RECONNECT",
}

export enum SpectateEvent {
  ERROR = "ERROR",
  BROADCAST_LIST_UPDATE = "BROADCAST_LIST_UPDATE",
  NEW_FILE = "NEW_FILE",
  LOG = "LOG",
  RECONNECT = "RECONNECT",
  GAME_END = "GAME_END",
  SPECTATE_LIST_UPDATE = "SPECTATE_LIST_UPDATE",
}

export type BroadcastService = {
  onSpectateReconnect(handle: () => void): () => void;
  onBroadcastReconnect(handle: (config: StartBroadcastConfig) => void): () => void;
  onBroadcastErrorMessage(handle: (message?: string) => void): () => void;
  onBroadcastListUpdated(handle: (items: BroadcasterItem[]) => void): () => void;
  onDolphinStatusChanged(handle: (status: number) => void): () => void;
  onSlippiStatusChanged(handle: (status: number) => void): () => void;
  onSpectateErrorMessage(handle: (message?: string) => void): () => void;
  connectToSpectateServer(authToken: string): Promise<void>;
  disconnectFromSpectateServer(): Promise<void>;
  refreshBroadcastList(): Promise<void>;
  watchBroadcast(broadcasterId: string): Promise<void>;
  startBroadcast(config: StartBroadcastConfig): Promise<void>;
  stopBroadcast(): Promise<void>;
};

export type SpectateDolphinOptions = {
  dolphinId?: string;
  idPostfix?: string;
};

export interface SpectateController {
  startSpectate(broadcastId: string, targetPath: string, dolphinOptions: SpectateDolphinOptions): Promise<string>;
  stopSpectate(broadcastId: string): Promise<void>;
  dolphinClosed(playbackId: string): Promise<void>;
  connect(authToken: string): Promise<void>;
  refreshBroadcastList(): Promise<void>;
  getOpenBroadcasts(): Promise<{ broadcastId: string; dolphinId: string; filePath?: string }[]>;
  getBroadcastListObservable(): Observable<BroadcasterItem[]>;
  getSpectateDetailsObservable(): Observable<{
    broadcastId: string;
    dolphinId: string;
    filePath: string;
    broadcasterName: string;
  }>;
  getGameEndObservable(): Observable<{
    broadcastId: string;
    dolphinId: string;
    filePath: string;
  }>;
  getErrorObservable(): Observable<Error | string>;
}
