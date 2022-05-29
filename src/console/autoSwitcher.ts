import { EventEmitter } from "events";
import OBSWebSocket from "obs-websocket-js";

import type { AutoSwitcherSettings } from "./types";
import { MirrorEvent } from "./types";

export class AutoSwitcher extends EventEmitter {
  private obs: OBSWebSocket;
  private obsSourceName: string;
  private obsIP: string;
  private obsPassword?: string;
  private statusOutput: { status: boolean; timeout: NodeJS.Timeout | null };
  private obsPairs: { scene: string; source: string }[];

  constructor(settings: AutoSwitcherSettings) {
    super();
    this.obs = new OBSWebSocket();
    this.obsSourceName = settings.sourceName;
    this.obsIP = settings.ip;
    this.obsPassword = settings.password;
    this.statusOutput = {
      status: false,
      timeout: null,
    };
    this.obsPairs = [];
  }

  public disconnect() {
    this.obs.disconnect();
  }

  public updateSettings(settings: AutoSwitcherSettings) {
    this.obsIP = settings.ip;
    this.obsSourceName = settings.sourceName;
    this.obsPassword = settings.password;
  }

  private _getSceneSources = async () => {
    // eslint-disable-line
    const res = await this.obs.send("GetSceneList");
    const scenes = res.scenes || [];
    const pairs = scenes.flatMap((scene) => {
      const sources = scene.sources || [];
      return sources.map((source) => ({
        scene: scene.name,
        source: source.name,
      }));
    });
    this.obsPairs = pairs.filter((pair) => pair.source === this.obsSourceName);
  };

  public async connect() {
    if (this.obsIP && this.obsSourceName) {
      // if you send a password when authentication is disabled, OBS will still connect
      try {
        await this.obs.connect({
          address: this.obsIP,
          password: this.obsPassword,
        });
      } catch (err) {
        this.emit(
          MirrorEvent.ERROR,
          "Could not connect to OBS, ensure you have OBS websocket installed, OBS is open, and the password is correct if using one.",
        );
        return;
      }

      this.obs.on("SceneItemAdded", async () => this._getSceneSources());
      this.obs.on("SceneItemRemoved", async () => this._getSceneSources());
      await this._getSceneSources();
    }
  }

  private _updateSourceVisibility(show: boolean) {
    const promises = this.obsPairs.map((pair) => {
      return this.obs
        .send("SetSceneItemProperties", {
          "scene-name": pair.scene,
          item: { name: pair.source },
          visible: show,
        } as any)
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

  /*
  As long as we are receiving data from the console, show the source feed in OBS.
  */
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
