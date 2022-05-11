import { Ports } from "@slippi/slippi-js";
import { EventEmitter } from "events";
import net from "net";

import { MirrorEvent } from "./types";

interface ConsoleDataBuffer {
  buffersToConcat: Buffer[];
  fullBuffer: Buffer;
}

export class ConsoleRelay extends EventEmitter {
  private server: net.Server | null;
  private dataBuffer: ConsoleDataBuffer;
  private clients: net.Socket[];

  constructor(id: number) {
    super();
    this.clients = [];
    this.dataBuffer = {
      buffersToConcat: [],
      fullBuffer: Buffer.from([]),
    };
    this.server = net.createServer((socket) => {
      socket.setNoDelay().setTimeout(20000);

      // Only get the full buffer when the client connects for performance
      const buf = this.getFullBuffer();
      socket.write(buf);

      this.clients.push(socket);
      socket.on("close", (err) => {
        if (err) {
          console.warn(err);
        }
        this.clients = this.clients.filter((client) => socket !== client);
      });
    });
    this.server.listen(Ports.RELAY_START + id, "0.0.0.0");
  }

  public stopRelay() {
    this.clients.forEach((client) => client.destroy());
    this.clients = [];
    if (this.server !== null) {
      this.server.close();
    }
    this.server = null;
  }

  public write(newData: Buffer) {
    this.dataBuffer.buffersToConcat.push(newData);
    if (this.clients) {
      this.clients.forEach((client) => {
        client.write(newData, (err) => {
          if (err) {
            this.emit(MirrorEvent.ERROR, err);
          }
        });
      });
    }
  }

  public async clearBuffer() {
    this.dataBuffer.buffersToConcat = [];
    this.dataBuffer.fullBuffer = Buffer.from([]);
  }

  private getFullBuffer() {
    if (this.dataBuffer.buffersToConcat.length > 0) {
      this.dataBuffer.fullBuffer = Buffer.concat([this.dataBuffer.fullBuffer, ...this.dataBuffer.buffersToConcat]);
    }
    this.dataBuffer.buffersToConcat = [];
    return this.dataBuffer.fullBuffer;
  }
}
