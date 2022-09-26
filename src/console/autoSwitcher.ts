import { EventEmitter } from "events";
import { isIPv6 } from "net";
import OBSWebSocket, { EventSubscription } from "obs-websocket-js";

import type { AutoSwitcherSettings } from "./types";
import { MirrorEvent } from "./types";

export class AutoSwitcher extends EventEmitter {
  private obs: OBSWebSocket;
  private obsIP: string;
  private obsPort: string;
  private obsPassword?: string;
  private obsSourceName: string;
  private statusOutput: { status: boolean; timeout: NodeJS.Timeout | null };
  private obsPairs: { scene: string; id: number }[];

  constructor(settings: AutoSwitcherSettings) {
    super();
    this.obs = new OBSWebSocket();
    this.obsIP = settings.ip;
    this.obsPort = settings.port;
    this.obsPassword = settings.password;
    this.obsSourceName = settings.sourceName;
    this.statusOutput = {
      status: false,
      timeout: null,
    };
    this.obsPairs = [];
  }

  public async disconnect() {
    await this.obs.disconnect();
  }

  public updateSettings(settings: AutoSwitcherSettings) {
    this.obsIP = settings.ip;
    this.obsPort = settings.port;
    this.obsSourceName = settings.sourceName;
    this.obsPassword = settings.password;
  }

  private _getSceneSources = async () => {
    const res = await this.obs.call("GetSceneList");
    const scenes = res.scenes || [];
    scenes.forEach(async (scene) => {
      const sceneName = scene.sceneName!.toString();
      const sceneItemListRes = await this.obs.call("GetSceneItemList", { sceneName });
      const sources = sceneItemListRes.sceneItems;
      sources.forEach((source) => {
        if (source.sourceName!.toString() !== this.obsSourceName) {
          return;
        }
        this.obsPairs.push({
          scene: sceneName,
          id: parseInt(source.sceneItemId!.toString()),
        });
      });
    });
  };

  public async connect() {
    if (this.obsIP && this.obsPort && this.obsSourceName) {
      // if you send a password when authentication is disabled, OBS will still connect
      try {
        const obsAddress = isIPv6(this.obsIP) ? `[${this.obsIP}]:${this.obsPort}` : `${this.obsIP}:${this.obsPort}`;
        const { obsWebSocketVersion, negotiatedRpcVersion } = await this.obs.connect(
          `ws://${obsAddress}`,
          this.obsPassword,
          {
            rpcVersion: 1,
            eventSubscriptions: EventSubscription.All | EventSubscription.SceneItems,
          },
        );
        this.emit(MirrorEvent.LOG, `Connected to OBS Websocket ${obsWebSocketVersion} (RPC ${negotiatedRpcVersion})`);
      } catch (err) {
        this.emit(
          MirrorEvent.ERROR,
          "Could not connect to OBS, ensure you have OBS websocket installed, OBS is open, and the password is correct if using one.",
        );
        return;
      }

      this.obs.on("SceneItemCreated", async (data) => {
        if (data.sourceName !== this.obsSourceName) {
          return;
        }
        this.obsPairs.push({ scene: data.sceneName, id: data.sceneItemId });
      });

      this.obs.on("SceneItemRemoved", async (data) => {
        if (data.sourceName !== this.obsSourceName) {
          return;
        }
        this.obsPairs = this.obsPairs.filter((val) => val.scene !== data.sceneName || val.id !== data.sceneItemId);
      });

      await this._getSceneSources();
    }
  }

  private _updateSourceVisibility(show: boolean) {
    const promises = this.obsPairs.map((pair) => {
      return this.obs
        .call("SetSceneItemEnabled", {
          sceneName: pair.scene,
          sceneItemId: pair.id,
          sceneItemEnabled: show,
        })
        .catch((err) => {
          if (err) {
            this.emit(MirrorEvent.ERROR, err);
          }
        });
    });
    Promise.all(promises).catch((err) => {
      if (err) {
        this.emit(MirrorEvent.ERROR, err);
      }
    });
  }

  private _setStatus(value: boolean) {
    this.statusOutput.status = value;
    this._updateSourceVisibility(value);
  }

  // As long as we are receiving data from the console, show the source feed in OBS.
  public handleStatusOutput(timeoutLength = 200) {
    const setTimer = () => {
      if (this.statusOutput.timeout) {
        // If we have a timeout, clear it
        clearTimeout(this.statusOutput.timeout);
      }

      this.statusOutput.timeout = setTimeout(() => {
        // If we timeout, set and set status
        this._setStatus(false);
      }, timeoutLength);
    };

    if (this.statusOutput.status) {
      // If game is currently active, reset the timer
      setTimer();
      return;
    }

    // Here we did not have a game going, so let's indicate we do now
    this._setStatus(true);

    // Set timer
    setTimer();
  }
}
