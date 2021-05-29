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
}

export enum BroadcastEvent {
  slippiStatusChange = "slippiStatusChange",
  dolphinStatusChange = "dolphinStatusChange",
  error = "broadcastError",
}
