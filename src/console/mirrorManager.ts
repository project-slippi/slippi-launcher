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
import { MirrorConfig, MirrorDetails } from "./types";

/**
 * Responsible for setting up and keeping track of active console connections and mirroring.
 */
export class MirrorManager {
  private mirrors: Record<string, MirrorDetails> = {};

  public constructor() {
    dolphinManager.on("dolphin-closed", (dolphinPlaybackId: string) => {
      const broadcastInfo = Object.values(this.mirrors).find((info) => info.ipAddress === dolphinPlaybackId);
      if (!broadcastInfo) {
        // This is not one of the spectator dolphin instances
        return;
      }

      log.info("[Mirroring] Dolphin closed");

      const details = this.mirrors[dolphinPlaybackId];
      if (!details) {
        return;
      }

      details.isMirroring = false;
      if (details.autoSwitcher) {
        details.autoSwitcher.disconnect();
      }
    });
  }

  public async start(config: MirrorConfig) {
    if (this.mirrors[config.ipAddress]) {
      log.info(`[Mirroring] already connected to Wii @ ${config.ipAddress}`);
      return;
    }

    log.info("[Mirroring] Setting up mirror");

    const fileWriter = new SlpFileWriter({ folderPath: config.folderPath, consoleNickname: "unknown" });
    fileWriter.on(SlpFileWriterEvent.NEW_FILE, (currFilePath) => {
      this._playFile(currFilePath, config.ipAddress);
    });

    const connection = new ConsoleConnection();
    connection.once("connect", () => {
      log.info("[Mirroring] Connecting to Wii");
      connection.on("handshake", (details: ConnectionDetails) => {
        log.info("[Mirroring] Got handshake from wii");
        log.info(details);
        fileWriter.updateSettings({ consoleNickname: details.consoleNick });
        // this.forceConsoleUiUpdate();
      });
      // connection.on("statusChange", (status) => this.setStatus(status));
      connection.on("data", (data) => fileWriter.write(data));
    });
    connection.connect(config.ipAddress, config.port ?? Ports.DEFAULT);

    let autoSwitcher: AutoSwitcher | null = null;
    if (config.autoSwitcherSettings) {
      autoSwitcher = new AutoSwitcher(config.autoSwitcherSettings);
    }

    fileWriter.on(SlpStreamEvent.COMMAND, (data) => {
      if (!autoSwitcher) {
        return;
      }

      const { command, payload } = data;
      switch (command) {
        case Command.POST_FRAME_UPDATE: {
          const frame = (payload as PostFrameUpdateType).frame;
          // Only show OBS source in the later portion of the game loading stage
          if (frame !== null && frame >= -60) {
            autoSwitcher.handleStatusOutput();
          }
          break;
        }
        case Command.GAME_END: {
          if ((payload as GameEndType).gameEndMethod !== 7) {
            autoSwitcher.handleStatusOutput(700);
          }
          break;
        }
      }
    });

    // add mirror config to mirrors so we can track it
    this.mirrors[config.ipAddress] = {
      ...config,
      fileWriter,
      connection,
      autoSwitcher,
    };
  }

  public disconnect(ip: string) {
    log.info("[Mirroring] Disconnect request");
    const details = this.mirrors[ip];
    if (!details) {
      console.warn(`Error disconnecting. No mirror details found for: ${ip}`);
      return;
    }

    details.connection.disconnect();
    if (details.autoSwitcher) {
      details.autoSwitcher.disconnect();
    }
    delete this.mirrors[ip];
  }

  public async startMirroring(ip: string) {
    log.info("[Mirroring] Mirroring start");
    const details = this.mirrors[ip];
    if (!details) {
      console.warn(`Could not start mirroring. No mirror details found for: ${ip}`);
      return;
    }

    details.isMirroring = true;
    if (details.autoSwitcher) {
      log.info("[Mirroring] Connecting to OBS");
      details.autoSwitcher.connect();
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
