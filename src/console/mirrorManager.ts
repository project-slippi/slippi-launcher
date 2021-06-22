import { dolphinManager } from "@dolphin/manager";
import { ReplayCommunication } from "@dolphin/types";
import {
  Command,
  ConnectionDetails,
  ConnectionEvent,
  ConnectionStatus,
  ConsoleConnection,
  GameEndType,
  Ports,
  PostFrameUpdateType,
  SlpFileWriter,
  SlpFileWriterEvent,
  SlpStreamEvent,
} from "@slippi/slippi-js";
import log from "electron-log";
import path from "path";

import { AutoSwitcher } from "./autoSwitcher";
import { consoleMirrorStatusUpdated } from "./ipc";
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

  public async connect(config: MirrorConfig) {
    if (this.mirrors[config.ipAddress]) {
      log.info(`[Mirroring] already connected to Wii @ ${config.ipAddress}`);
      return;
    }

    log.info("[Mirroring] Setting up mirror");

    const fileWriter = new SlpFileWriter({ folderPath: config.folderPath, consoleNickname: "unknown" });
    fileWriter.on(SlpFileWriterEvent.NEW_FILE, (currFilePath) => {
      this._playFile(currFilePath, config.ipAddress);

      // Let the front-end know of the new file that we're writing too
      consoleMirrorStatusUpdated
        .main!.trigger({
          ip: config.ipAddress,
          info: {
            filename: path.basename(currFilePath),
          },
        })
        .catch((err) => log.warn(err));
    });

    // Clear the current writing file
    fileWriter.on(SlpFileWriterEvent.FILE_COMPLETE, () => {
      consoleMirrorStatusUpdated
        .main!.trigger({
          ip: config.ipAddress,
          info: {
            filename: null,
          },
        })
        .catch((err) => log.warn(err));
    });

    const connection = new ConsoleConnection();
    connection.once("connect", () => {
      log.info("[Mirroring] Connecting to Wii");
      connection.on(ConnectionEvent.HANDSHAKE, (details: ConnectionDetails) => {
        log.info("[Mirroring] Got handshake from wii");
        log.info(details);
        fileWriter.updateSettings({ consoleNickname: details.consoleNick });

        consoleMirrorStatusUpdated
          .main!.trigger({
            ip: config.ipAddress,
            info: {
              nickname: details.consoleNick,
            },
          })
          .catch((err) => log.warn(err));
      });

      connection.on(ConnectionEvent.STATUS_CHANGE, (status) => {
        log.info(`${config.ipAddress} status changed: ${status}`);
        consoleMirrorStatusUpdated
          .main!.trigger({
            ip: config.ipAddress,
            info: {
              status,
            },
          })
          .catch((err) => log.warn(err));
      });

      connection.on(ConnectionEvent.DATA, (data) => fileWriter.write(data));
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
      log.warn(`Error disconnecting. No mirror details found for: ${ip}`);
      return;
    }

    details.connection.disconnect();
    if (details.autoSwitcher) {
      details.autoSwitcher.disconnect();
    }
    delete this.mirrors[ip];

    // FIXME: Not sure why the disconnected status update isn't working
    // For now let's just manually show the disconnected status
    consoleMirrorStatusUpdated
      .main!.trigger({
        ip,
        info: {
          status: ConnectionStatus.DISCONNECTED,
          filename: null,
        },
      })
      .catch((err) => log.warn(err));
  }

  public async startMirroring(ip: string) {
    log.info("[Mirroring] Mirroring start");
    const details = this.mirrors[ip];
    if (!details) {
      log.warn(`Could not start mirroring. No mirror details found for: ${ip}`);
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
