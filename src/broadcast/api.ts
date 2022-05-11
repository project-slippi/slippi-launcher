/* eslint-disable import/no-default-export */

import {
  ipc_broadcastErrorOccurredEvent,
  ipc_broadcastListUpdatedEvent,
  ipc_broadcastReconnectEvent,
  ipc_dolphinStatusChangedEvent,
  ipc_refreshBroadcastList,
  ipc_slippiStatusChangedEvent,
  ipc_spectateErrorOccurredEvent,
  ipc_spectateReconnectEvent,
  ipc_startBroadcast,
  ipc_stopBroadcast,
  ipc_watchBroadcast,
} from "./ipc";
import type { BroadcasterItem, BroadcastService, StartBroadcastConfig } from "./types";

const broadcastApi: BroadcastService = {
  onSpectateReconnect(handle: () => void) {
    const { destroy } = ipc_spectateReconnectEvent.renderer!.handle(async () => {
      handle();
    });
    return destroy;
  },
  onBroadcastReconnect(handle: (config: StartBroadcastConfig) => void) {
    const { destroy } = ipc_broadcastReconnectEvent.renderer!.handle(async ({ config }) => {
      handle(config);
    });
    return destroy;
  },
  onBroadcastErrorMessage(handle: (message: string | null) => void) {
    const { destroy } = ipc_broadcastErrorOccurredEvent.renderer!.handle(async ({ errorMessage }) => {
      handle(errorMessage);
    });
    return destroy;
  },
  onBroadcastListUpdated(handle: (items: BroadcasterItem[]) => void) {
    const { destroy } = ipc_broadcastListUpdatedEvent.renderer!.handle(async ({ items }) => {
      handle(items);
    });
    return destroy;
  },
  onDolphinStatusChanged(handle: (status: number) => void) {
    const { destroy } = ipc_dolphinStatusChangedEvent.renderer!.handle(async ({ status }) => {
      handle(status);
    });
    return destroy;
  },
  onSlippiStatusChanged(handle: (status: number) => void) {
    const { destroy } = ipc_slippiStatusChangedEvent.renderer!.handle(async ({ status }) => {
      handle(status);
    });
    return destroy;
  },
  onSpectateErrorMessage(handle: (message: string | null) => void) {
    const { destroy } = ipc_spectateErrorOccurredEvent.renderer!.handle(async ({ errorMessage }) => {
      handle(errorMessage);
    });
    return destroy;
  },
  async refreshBroadcastList(authToken: string): Promise<void> {
    await ipc_refreshBroadcastList.renderer!.trigger({ authToken });
  },
  async watchBroadcast(broadcasterId: string): Promise<void> {
    await ipc_watchBroadcast.renderer!.trigger({ broadcasterId });
  },
  async startBroadcast(config: StartBroadcastConfig): Promise<void> {
    await ipc_startBroadcast.renderer!.trigger(config);
  },
  async stopBroadcast(): Promise<void> {
    await ipc_stopBroadcast.renderer!.trigger({});
  },
};

export default broadcastApi;
