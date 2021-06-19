import { dolphinManager } from "@dolphin/manager";
import { ReplayCommunication } from "@dolphin/types";
import {
  Command,
  ConnectionDetails,
  ConsoleConnection,
  GameEndType,
  Ports,
  PostFrameUpdateType,
  SlpFileWriter,
  SlpFileWriterEvent,
  SlpStreamEvent,
} from "@slippi/slippi-js";
import log from "electron-log";

import { AutoSwitcher } from "./autoSwitcher";
import { MirrorDetails } from "./types";

/**
 * Responsible for setting up and keeping track of active console connections and mirroring.
 */
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
      if (this.mirrors[dolphinPlaybackId].autoSwitcher) {
        this.mirrors[dolphinPlaybackId].autoSwitcher!.disconnect();
      }
    });
  }

  public async start(config: MirrorDetails) {
    if (this.mirrors[config.ipAddress]) {
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
        // this.forceConsoleUiUpdate();
      });
      // connection.on("statusChange", (status) => this.setStatus(status));
      connection.on("data", (data) => config.fileWriter!.write(data));
    });
    connection.connect(config.ipAddress, config.port || Ports.DEFAULT);

    config.connection = connection;

    if (config.autoSwitcherSettings) {
      config.autoSwitcher = new AutoSwitcher(config.autoSwitcherSettings);
    }

    fileWriter.on(SlpStreamEvent.COMMAND, (data) => {
      const { command, payload } = data;
      switch (command) {
        case Command.POST_FRAME_UPDATE:
          // Only show OBS source in the later portion of the game loading stage
          if ((payload as PostFrameUpdateType).frame! >= -60) {
            config.autoSwitcher!.handleStatusOutput();
          }
          break;
        case Command.GAME_END:
          if ((payload as GameEndType).gameEndMethod !== 7) {
            config.autoSwitcher!.handleStatusOutput(700);
          }
          break;
        default:
          break;
      }
    });

    // add mirror config to mirrors so we can track it
    this.mirrors[config.ipAddress] = config;
  }

  public disconnect(ip: string) {
    log.info("[Mirroring] Disconnect request");
    this.mirrors[ip].connection!.disconnect();
    this.mirrors[ip].autoSwitcher!.disconnect();
    delete this.mirrors[ip];
  }

  public async startMirroring(ip: string) {
    log.info("[Mirroring] Mirroring start");
    this.mirrors[ip].isMirroring = true;
    if (this.mirrors[ip].autoSwitcher) {
      log.info("[Mirroring] Connecting to OBS");
      this.mirrors[ip].autoSwitcher!.connect();
    }
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
