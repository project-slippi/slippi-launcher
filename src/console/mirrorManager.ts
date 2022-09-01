import type { ConnectionDetails, GameEndType, PostFrameUpdateType } from "@slippi/slippi-js";
import {
  Command,
  ConnectionEvent,
  ConnectionStatus,
  ConsoleConnection,
  Ports,
  SlpFileWriter,
  SlpFileWriterEvent,
  SlpStreamEvent,
} from "@slippi/slippi-js";
import { EventEmitter } from "events";
import * as fs from "fs-extra";
import path from "path";

import { AutoSwitcher } from "./autoSwitcher";
import { ConsoleRelay } from "./consoleRelay";
import type { MirrorConfig, MirrorDetails } from "./types";
import { MirrorEvent } from "./types";

/**
 * Responsible for setting up and keeping track of active console connections and mirroring.
 */
export class MirrorManager extends EventEmitter {
  private mirrors: Record<string, MirrorDetails> = {};

  constructor() {
    super();
  }

  public async connect(config: MirrorConfig) {
    if (this.mirrors[config.ipAddress]) {
      this.emit(MirrorEvent.ERROR, `Already connected to Wii @ ${config.ipAddress}`);
      return;
    }

    this.emit(MirrorEvent.LOG, "Setting up mirror");

    try {
      await fs.ensureDir(config.folderPath);
    } catch (err) {
      if (err) {
        this.emit(MirrorEvent.ERROR, err);
      }
    }

    const fileWriter = new SlpFileWriter({ folderPath: config.folderPath, consoleNickname: "unknown" });
    fileWriter.on(SlpFileWriterEvent.NEW_FILE, (currFilePath) => {
      if (this.mirrors[config.ipAddress].isMirroring) {
        this._playFile(currFilePath, config.ipAddress).catch((err) => {
          if (err) {
            this.emit(MirrorEvent.ERROR, err);
          }
        });
      }

      // Let the front-end know of the new file that we're writing too
      this.emit(MirrorEvent.MIRROR_STATUS_CHANGE, {
        ip: config.ipAddress,
        info: {
          filename: path.basename(currFilePath),
        },
      });
    });

    // Clear the current writing file
    fileWriter.on(SlpFileWriterEvent.FILE_COMPLETE, () => {
      this.emit(MirrorEvent.MIRROR_STATUS_CHANGE, {
        ip: config.ipAddress,
        info: {
          filename: null,
        },
      });
    });

    let relay: ConsoleRelay | null = null;
    if (config.enableRelay) {
      this.emit(MirrorEvent.LOG, "Starting relay");
      relay = new ConsoleRelay(config.id);
      relay.on(MirrorEvent.LOG, (msg) => this.emit(MirrorEvent.LOG, msg));
      relay.on(MirrorEvent.ERROR, (err) => this.emit(MirrorEvent.ERROR, err));
    }

    const connection = new ConsoleConnection();
    connection.on(ConnectionEvent.ERROR, async (err) => {
      this.emit(MirrorEvent.ERROR, err);

      const status = connection.getStatus();
      if (status === ConnectionStatus.DISCONNECTED) {
        await this.disconnect(config.ipAddress);
      }
    });
    connection.once(ConnectionEvent.CONNECT, () => {
      this.emit(MirrorEvent.LOG, "Connecting to Wii");
      connection.on(ConnectionEvent.HANDSHAKE, (details: ConnectionDetails) => {
        this.emit(MirrorEvent.LOG, "Got handshake from wii");
        this.emit(MirrorEvent.LOG, details);
        if (config.useNicknameFolders) {
          const replayFolder = path.join(config.folderPath, details.consoleNick);
          fs.ensureDirSync(replayFolder);

          fileWriter.updateSettings({ consoleNickname: details.consoleNick, folderPath: replayFolder });
        }

        this.emit(MirrorEvent.MIRROR_STATUS_CHANGE, {
          ip: config.ipAddress,
          info: {
            nickname: details.consoleNick,
            nintendontVersion: details.version,
          },
        });
      });

      connection.on(ConnectionEvent.STATUS_CHANGE, (status: ConnectionStatus) => {
        this.emit(MirrorEvent.LOG, `${config.ipAddress} status changed: ${status}`);
        this.emit(MirrorEvent.MIRROR_STATUS_CHANGE, {
          ip: config.ipAddress,
          info: {
            status,
          },
        });
      });

      connection.on(ConnectionEvent.DATA, (data: Buffer) => {
        fileWriter.write(data);
        if (relay) {
          relay.write(data);
        }
      });
    });
    this.emit(MirrorEvent.LOG, config.port);
    connection.connect(config.ipAddress, config.port ?? Ports.DEFAULT, config.isRealtime);

    let autoSwitcher: AutoSwitcher | null = null;
    if (config.autoSwitcherSettings) {
      autoSwitcher = new AutoSwitcher(config.autoSwitcherSettings);
      autoSwitcher.on(MirrorEvent.LOG, (msg) => this.emit(MirrorEvent.LOG, msg));
      autoSwitcher.on(MirrorEvent.ERROR, (err) => this.emit(MirrorEvent.ERROR, err));
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
            relay.clearBuffer().catch((err) => {
              if (err) {
                this.emit(MirrorEvent.ERROR, err);
              }
            }); // clear buffer after each game to avoid concating a gigantic array
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

  public async disconnect(ip: string) {
    this.emit(MirrorEvent.LOG, "Disconnect requested");
    const details = this.mirrors[ip];
    if (!details) {
      this.emit(MirrorEvent.ERROR, `Error disconnecting. No mirror details found for: ${ip}`);
      return;
    }

    details.connection.disconnect();
    if (details.autoSwitcher) {
      await details.autoSwitcher.disconnect();
    }
    if (details.relay) {
      details.relay.stopRelay();
    }
    delete this.mirrors[ip];

    // FIXME: Not sure why the disconnected status update isn't working
    // For now let's just manually show the disconnected status
    this.emit(MirrorEvent.MIRROR_STATUS_CHANGE, {
      ip,
      info: {
        status: ConnectionStatus.DISCONNECTED,
        isMirroring: false,
        filename: null,
        nintendontVersion: null,
      },
    });
  }

  public async startMirroring(ip: string) {
    this.emit(MirrorEvent.LOG, "Mirroring starting");
    const details = this.mirrors[ip];
    if (!details) {
      this.emit(MirrorEvent.ERROR, `Could not start mirroring. No mirror details found for: ${ip}`);
      return;
    }

    details.isMirroring = true;
    if (details.autoSwitcher) {
      this.emit(MirrorEvent.LOG, "Connecting to OBS");
      await details.autoSwitcher.connect();
    }

    const currentFile = details.fileWriter.getCurrentFilename() || "";
    await this._playFile(currentFile, ip);

    this.emit(MirrorEvent.MIRROR_STATUS_CHANGE, {
      ip,
      info: {
        isMirroring: details.isMirroring,
      },
    });
  }

  private async _playFile(filePath: string, playbackId: string) {
    return this.emit(
      MirrorEvent.NEW_FILE,
      playbackId,
      filePath,
      this.mirrors[playbackId].isRealtime,
      this.mirrors[playbackId].nickname,
    );
  }

  public async handleClosedDolphin(playbackId: string) {
    const broadcastInfo = Object.values(this.mirrors).find((info) => info.ipAddress === playbackId);
    if (!broadcastInfo) {
      // This is not one of the spectator dolphin instances
      return;
    }

    const details = this.mirrors[playbackId];
    if (!details) {
      return;
    }

    details.isMirroring = false;
    if (details.autoSwitcher) {
      await details.autoSwitcher.disconnect();
    }

    this.emit(MirrorEvent.MIRROR_STATUS_CHANGE, {
      ip: details.ipAddress,
      info: {
        isMirroring: details.isMirroring,
      },
    });
  }
}

export const mirrorManager = new MirrorManager();
