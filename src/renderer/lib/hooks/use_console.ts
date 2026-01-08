import { ConnectionStatus } from "@console/types";
import { create } from "zustand";

type StoreState = {
  isBroadcasting: boolean;
  startTime: Date | undefined;
  endTime: Date | undefined;
  slippiConnectionStatus: ConnectionStatus;
  dolphinConnectionStatus: ConnectionStatus;
  broadcastError: string | undefined;
};

type StoreReducers = {
  setIsBroadcasting: (isBroadcasting: boolean) => void;
  setSlippiConnectionStatus: (connectionStatus: number) => void;
  setDolphinConnectionStatus: (connectionStatus: number) => void;
  setBroadcastError: (error: string | undefined) => void;
};

const initialState: StoreState = {
  isBroadcasting: false,
  startTime: undefined,
  endTime: undefined,
  slippiConnectionStatus: ConnectionStatus.DISCONNECTED,
  dolphinConnectionStatus: ConnectionStatus.DISCONNECTED,
  broadcastError: undefined,
};

export const useConsole = create<StoreState & StoreReducers>((set, get) => ({
  // Set the initial state
  ...initialState,

  // Reducers
  setIsBroadcasting: (isBroadcasting) => {
    const state = get();
    const wasBroadcasting = state.isBroadcasting;
    if (wasBroadcasting && !isBroadcasting) {
      // We stopped broadcasting so update the end time
      set({
        endTime: new Date(),
      });
    } else if (isBroadcasting && !wasBroadcasting) {
      // We started broadcasting so update the start time
      set({
        startTime: new Date(),
        endTime: undefined,
      });
    }
    set({
      isBroadcasting,
    });
  },
  setSlippiConnectionStatus: (connectionStatus) => {
    const { dolphinConnectionStatus, setIsBroadcasting } = get();
    const dolphinConnected = dolphinConnectionStatus === ConnectionStatus.CONNECTED;
    const isBroadcasting = dolphinConnected && connectionStatus !== ConnectionStatus.DISCONNECTED;
    set({
      slippiConnectionStatus: connectionStatus,
    });
    setIsBroadcasting(isBroadcasting);
  },

  setDolphinConnectionStatus: (connectionStatus) => {
    const { slippiConnectionStatus, setIsBroadcasting } = get();
    const slippiConnected = slippiConnectionStatus === ConnectionStatus.CONNECTED;
    const isBroadcasting = slippiConnected && connectionStatus !== ConnectionStatus.DISCONNECTED;
    set({
      dolphinConnectionStatus: connectionStatus,
    });
    setIsBroadcasting(isBroadcasting);
  },

  setBroadcastError: (error) => {
    set({
      broadcastError: error,
    });
  },
}));
