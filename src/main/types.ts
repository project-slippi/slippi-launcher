import { DolphinMessageType } from "@slippi/slippi-js";
import { ChildProcessWithoutNullStreams } from "child_process";
import { DolphinUseType } from "common/dolphin";

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

export type SlippiBroadcastEvent = TypeMap<SlippiBroadcastEventPayload>[keyof TypeMap<SlippiBroadcastEventPayload>];

type DolphinInstancePayload = {
  [DolphinUseType.CONFIG]: {
    dolphin?: ChildProcessWithoutNullStreams;
  };
  [DolphinUseType.NETPLAY]: {
    dolphin?: ChildProcessWithoutNullStreams;
  };
  [DolphinUseType.PLAYBACK]: {
    dolphin?: ChildProcessWithoutNullStreams;
    commFilePath?: string;
  };
  [DolphinUseType.SPECTATE]: {
    index?: number; // should refer to the index in relation to the list of sources for spectating
    dolphin?: ChildProcessWithoutNullStreams;
    commFilePath?: string;
    broadcastId?: string; // only necessary for spectating dolphins
  };
};

export type DolphinInstance = TypeMap<DolphinInstancePayload>[keyof TypeMap<DolphinInstancePayload>];
