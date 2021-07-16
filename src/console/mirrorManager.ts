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
import * as fs from "fs-extra";
import path from "path";

import { AutoSwitcher } from "./autoSwitcher";
import { ConsoleRelay } from "./consoleRelay";
import { ipc_consoleMirrorStatusUpdatedEvent } from "./ipc";
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

    await fs.ensureDir(config.folderPath);

    const fileWriter = new SlpFileWriter({ folderPath: config.folderPath, consoleNickname: "unknown" });
    fileWriter.on(SlpFileWriterEvent.NEW_FILE, (currFilePath) => {
      if (this.mirrors[config.ipAddress].isMirroring) {
        this._playFile(currFilePath, config.ipAddress).catch(log.warn);
      }

      // Let the front-end know of the new file that we're writing too
      ipc_consoleMirrorStatusUpdatedEvent
        .main!.trigger({
          ip: config.ipAddress,
          info: {
            filename: path.basename(currFilePath),
          },
        })
        .catch(log.warn);
    });

    // Clear the current writing file
    fileWriter.on(SlpFileWriterEvent.FILE_COMPLETE, () => {
      ipc_consoleMirrorStatusUpdatedEvent
        .main!.trigger({
          ip: config.ipAddress,
          info: {
            filename: null,
          },
        })
        .catch((err) => log.warn(err));
    });

    let relay: ConsoleRelay | null = null;
    if (config.enableRelay) {
      log.info("starting relay");
      relay = new ConsoleRelay(config.id);
    }

    const connection = new ConsoleConnection();
    connection.once("connect", () => {
      log.info("[Mirroring] Connecting to Wii");
      connection.on(ConnectionEvent.HANDSHAKE, (details: ConnectionDetails) => {
        log.info("[Mirroring] Got handshake from wii");
        log.info(details);
        fileWriter.updateSettings({ consoleNickname: details.consoleNick });

        ipc_consoleMirrorStatusUpdatedEvent
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
        ipc_consoleMirrorStatusUpdatedEvent
          .main!.trigger({
            ip: config.ipAddress,
            info: {
              status,
            },
          })
          .catch((err) => log.warn(err));
      });

      connection.on(ConnectionEvent.DATA, (data: Buffer) => {
        fileWriter.write(data);
        if (relay) {
          relay.write(data);
        }
      });
    });
    log.info(config.port);
    connection.connect(config.ipAddress, config.port ?? Ports.DEFAULT);

    let autoSwitcher: AutoSwitcher | null = null;
    if (config.autoSwitcherSettings) {
      autoSwitcher = new AutoSwitcher(config.autoSwitcherSettings);
    }

    fileWriter.on(SlpStreamEvent.COMMAND, (data) => {
      if (!autoSwitcher && !relay) {
        return;
      }
      const { command, payload } = data;
      switch (command) {
        case Command.POST_FRAME_UPDATE: {
          const frame = (payload as PostFrameUpdateType).frame;
          // Only show OBS source in the later portion of the game loading stage
          if (frame !== null && frame >= -60) {
            if (autoSwitcher) {
              autoSwitcher.handleStatusOutput();
            }
          }
          break;
        }
        case Command.GAME_END: {
          if ((payload as GameEndType).gameEndMethod !== 7) {
            if (autoSwitcher) {
              autoSwitcher.handleStatusOutput(700); // 700ms is about enough time for GAME! to stop shaking
            }
          }
          if (relay) {
            relay.clearBuffer().catch(log.warn); // clear buffer after each game to avoid concating a gigantic array
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
      relay,
      isMirroring: false,
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
    if (details.relay) {
      details.relay.stopRelay();
    }
    delete this.mirrors[ip];

    // FIXME: Not sure why the disconnected status update isn't working
    // For now let's just manually show the disconnected status
    ipc_consoleMirrorStatusUpdatedEvent
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
      await details.autoSwitcher.connect();
    }

    const currentFile = details.fileWriter.getCurrentFilename() || "";
    await this._playFile(currentFile, ip);
  }

  private async _playFile(filePath: string, playbackId: string) {
    const replayComm: ReplayCommunication = {
      mode: "mirror",
      isRealTimeMode: this.mirrors[playbackId].isRealTimeMode,
      replay: filePath,
    };
    return dolphinManager.launchPlaybackDolphin(playbackId, replayComm);
  }
}

export const mirrorManager = new MirrorManager();
