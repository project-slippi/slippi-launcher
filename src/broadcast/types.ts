import type { DolphinMessageType } from "@slippi/slippi-js";

export interface BroadcasterItem {
  broadcaster: {
    name: string;
    uid: string;
  };
  id: string;
  name: string;
}

export interface StartBroadcastConfig {
  ip: string;
  port: number;
  viewerId: string;
  authToken: string;
  name?: string;
}

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
}

type TypeMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
      } & M[Key];
};

interface SlippiPlayload {
  payload: string;
  cursor: number;
  nextCursor: number;
}

type SlippiBroadcastEventPayload = {
  [DolphinMessageType.CONNECT_REPLY]: {
    version: number;
    nick: string;
    cursor: number;
  };
  [DolphinMessageType.GAME_EVENT]: SlippiPlayload;
  [DolphinMessageType.END_GAME]: SlippiPlayload;
  [DolphinMessageType.START_GAME]: SlippiPlayload;
};

export type SlippiBroadcastPayloadEvent =
  TypeMap<SlippiBroadcastEventPayload>[keyof TypeMap<SlippiBroadcastEventPayload>];

export interface BroadcastService {
  onSpectateReconnect(handle: () => void): () => void;
  onBroadcastReconnect(handle: (config: StartBroadcastConfig) => void): () => void;
  onBroadcastErrorMessage(handle: (message: string | null) => void): () => void;
  onBroadcastListUpdated(handle: (items: BroadcasterItem[]) => void): () => void;
  onDolphinStatusChanged(handle: (status: number) => void): () => void;
  onSlippiStatusChanged(handle: (status: number) => void): () => void;
  onSpectateErrorMessage(handle: (message: string | null) => void): () => void;
  refreshBroadcastList(authToken: string): Promise<void>;
  watchBroadcast(broadcasterId: string): Promise<void>;
  startBroadcast(config: StartBroadcastConfig): Promise<void>;
  stopBroadcast(): Promise<void>;
}
