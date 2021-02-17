import { DolphinMessageType } from "@slippi/slippi-js";

type SlippiBroadcastEventMap<M extends { [index: string]: any }> = {
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

export type SlippiBroadcastEvent = SlippiBroadcastEventMap<SlippiBroadcastEventPayload>[keyof SlippiBroadcastEventMap<SlippiBroadcastEventPayload>];
