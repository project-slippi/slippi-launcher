import { dolphinManager } from "@dolphin/manager";
import { ReplayCommunication } from "@dolphin/types";
import { ConnectionDetails, ConsoleConnection, Ports, SlpFileWriter, SlpFileWriterEvent } from "@slippi/slippi-js";
import log from "electron-log";

import { MirrorDetails } from "./types";

export class MirrorManager {
  private mirrors: { [ipAddress: string]: MirrorDetails };

  public constructor() {
    this.mirrors = {};
    dolphinManager.on("dolphin-closed", (dolphinPlaybackId: string) => {
      const broadcastInfo = Object.values(this.mirrors).find((info) => info.ipAddress === dolphinPlaybackId);
      if (!broadcastInfo) {
        // This is not one of the spectator dolphin instances
        return;
      }

      log.info("[Mirroring] Dolphin closed");

      this.mirrors[dolphinPlaybackId].isMirroring = false;
    });
  }

  public async start(config: MirrorDetails) {
    if (this.mirrors[config.ipAddress]) {
      // maybe we want to support editing the config, but for now i'm skipping that. get it right the first time idiots
      log.info(`[Mirroring] already connected to Wii @ ${config.ipAddress}`);
      return;
    }

    log.info("[Mirroring] Setting up mirror");

    const fileWriter = new SlpFileWriter({ folderPath: config.folderPath, consoleNickname: "unknown" });
    config.fileWriter = fileWriter;
    fileWriter.on(SlpFileWriterEvent.NEW_FILE, (currFilePath) => {
      this._playFile(currFilePath, config.ipAddress);
    });

    const connection = new ConsoleConnection();
    connection.once("connect", () => {
      log.info("[Mirroring] Connecting to Wii");
      connection.on("handshake", (details: ConnectionDetails) => {
        log.info("[Mirroring] Got handshake from wii");
        log.info(details);
        config.fileWriter!.updateSettings({ consoleNickname: details.consoleNick });
        // log.info(this.connDetails);
        // this.forceConsoleUiUpdate();
      });
      // connection.on("statusChange", (status) => this.setStatus(status));
      connection.on("data", (data) => config.fileWriter!.write(data));
    });
    connection.connect(config.ipAddress, config.port || Ports.DEFAULT);

    config.connection = connection;
    // add mirror config to mirrors so we can track it
    this.mirrors[config.ipAddress] = config;
  }
  public disconnect(ip: string) {
    log.info("[Mirroring] Disconnect request");
    this.mirrors[ip].connection!.disconnect();
  }

  public async startMirroring(ip: string) {
    log.info("[Mirroring] Mirroring start");
    this.mirrors[ip].isMirroring = true;
    this._playFile("", ip);
  }

  private _playFile(filePath: string, playbackId: string) {
    const replayComm: ReplayCommunication = {
      mode: "mirror",
      isRealTimeMode: this.mirrors[playbackId].isRealTimeMode,
      replay: filePath,
    };
    dolphinManager.launchPlaybackDolphin(playbackId, replayComm);
  }
}

export const mirrorManager = new MirrorManager();
