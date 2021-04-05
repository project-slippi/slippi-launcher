import { ConnectionStatus } from "@slippi/slippi-js";
import { BroadcastEvent } from "common/types";
import { ipcRenderer } from "electron";
import { unstable_batchedUpdates } from "react-dom";
import create from "zustand";

type StoreState = {
  isBroadcasting: boolean;
  startTime: Date | null;
  endTime: Date | null;
  slippiConnectionStatus: ConnectionStatus;
  dolphinConnectionStatus: ConnectionStatus;
  broadcastError: string | null;
};

type StoreReducers = {
  setIsBroadcasting: (isBroadcasting: boolean) => void;
  setSlippiConnectionStatus: (connectionStatus: number) => void;
  setDolphinConnectionStatus: (connectionStatus: number) => void;
  setBroadcastError: (error: string | null) => void;
};

const initialState: StoreState = {
  isBroadcasting: false,
  startTime: null,
  endTime: null,
  slippiConnectionStatus: ConnectionStatus.DISCONNECTED,
  dolphinConnectionStatus: ConnectionStatus.DISCONNECTED,
  broadcastError: null,
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
        endTime: null,
      });
    }
    set({
      isBroadcasting,
    });
  },
  setSlippiConnectionStatus: (connectionStatus) => {
    const { dolphinConnectionStatus, setIsBroadcasting } = get();
    const dolphinConnected = dolphinConnectionStatus === ConnectionStatus.CONNECTED;
    const isBroadcasting = dolphinConnected && connectionStatus === ConnectionStatus.CONNECTED;
    set({
      slippiConnectionStatus: connectionStatus,
    });
    setIsBroadcasting(isBroadcasting);
  },

  setDolphinConnectionStatus: (connectionStatus) => {
    const { slippiConnectionStatus, setIsBroadcasting } = get();
    const slippiConnected = slippiConnectionStatus === ConnectionStatus.CONNECTED;
    const isBroadcasting = slippiConnected && connectionStatus === ConnectionStatus.CONNECTED;
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

ipcRenderer.on(BroadcastEvent.slippiStatusChange, (_, data) => {
  const { status } = data;
  unstable_batchedUpdates(() => {
    useConsole.getState().setSlippiConnectionStatus(status);
  });
});

ipcRenderer.on(BroadcastEvent.dolphinStatusChange, (_, data) => {
  const { status } = data;
  unstable_batchedUpdates(() => {
    useConsole.getState().setDolphinConnectionStatus(status);
  });
});

ipcRenderer.on(BroadcastEvent.error, (_, data) => {
  const { error } = data;
  unstable_batchedUpdates(() => {
    useConsole.getState().setBroadcastError(error);
  });
});
