import { BroadcastEvent } from "common/types";
import { ipcRenderer } from "electron";
import { unstable_batchedUpdates } from "react-dom";
import create from "zustand";

type StoreState = {
  slippiConnectionStatus: number | null;
  dolphinConnectionStatus: number | null;
  broadcastError: string | null;
};

type StoreReducers = {
  setSlippiConnectionStatus: (connectionStatus: number) => void;
  setDolphinConnectionStatus: (connectionStatus: number) => void;
  setBroadcastError: (error: string | null) => void;
};

const initialState: StoreState = {
  slippiConnectionStatus: null,
  dolphinConnectionStatus: null,
  broadcastError: null,
};

export const useConsole = create<StoreState & StoreReducers>((set) => ({
  // Set the initial state
  ...initialState,

  // Reducers
  setSlippiConnectionStatus: (connectionStatus) => {
    set({
      slippiConnectionStatus: connectionStatus,
    });
  },

  setDolphinConnectionStatus: (connectionStatus) => {
    set({
      dolphinConnectionStatus: connectionStatus,
    });
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
