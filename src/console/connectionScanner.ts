import dgram from "dgram";
import electronLog from "electron-log";
import moment from "moment";

import { ipc_discoveredConsolesUpdatedEvent } from "./ipc";
import type { DiscoveredConsoleInfo } from "./types";

const log = electronLog.scope("connectionScanner");

const SECONDS = 1000;
const CONSOLE_EXPIRY_TIMEOUT = 35 * SECONDS;

export class ConnectionScanner {
  public availableConnectionsByIp: Record<string, DiscoveredConsoleInfo | undefined> = {};
  private timeoutsByIp: Record<string, NodeJS.Timeout | undefined> = {};
  private server: dgram.Socket | null = null;

  public getAvailable() {
    return this.availableConnectionsByIp;
  }

  public getIsScanning() {
    return !!this.server;
  }

  private _handleMessageReceive = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
    if (msg.slice(0, 10).toString() !== "SLIP_READY") {
      // This is not a Slippi broadcast message, do nothing
      return;
    }

    /* The structure of broadcast messages from the Wii should be:
     *  unsigned char cmd[10]; // 0 - 10
     *  u8 mac_addr[6]; // 10 - 16
     *  unsigned char nickname[32]; // 16 - 48
     */

    // String for Wii's MAC address
    const mac = [];
    for (let i = 10; i <= 15; i += 1) {
      mac.push(msg.readUInt8(i).toString(16).padStart(2, "0"));
    }
    const macAddr = mac.join(":");

    // Broadcast 'command' string
    // const cmd = msg.slice(0, 10).toString("ascii");
    // console.log(`Got broadcast ${cmd} from ${rinfo.address}:${rinfo.port}`);

    // Console nickname string
    const nick = msg.slice(16, 48).toString().split("\0").shift();

    // The Wii's IP address
    const ip = rinfo.address;

    const previous = this.availableConnectionsByIp[ip];
    const previousTimeoutHandler = this.timeoutsByIp[ip];

    // If we have received a new message from this IP, clear the previous
    // timeout hanlder so that this IP doesn't get removed
    if (previousTimeoutHandler) {
      clearTimeout(previousTimeoutHandler);
    }

    // If we don't get a message for 35 seconds, remove from list
    const timeoutHandler = setTimeout(() => {
      delete this.availableConnectionsByIp[ip];
      this._emitConsoleListUpdatedEvent();
    }, CONSOLE_EXPIRY_TIMEOUT);

    const newConsole = {
      ip: ip,
      mac: macAddr,
      name: nick,
      firstFound: previous ? previous.firstFound : moment().toISOString(),
    };
    this.availableConnectionsByIp[ip] = newConsole;

    this.timeoutsByIp[ip] = timeoutHandler;

    if (!previous) {
      this._emitConsoleListUpdatedEvent();
    }

    // Force UI update to show new connection
    // this.forceConsoleUiUpdate();
  };

  private _emitConsoleListUpdatedEvent() {
    const consoleList = Object.values(this.availableConnectionsByIp) as DiscoveredConsoleInfo[];
    ipc_discoveredConsolesUpdatedEvent.main!.trigger({ consoles: consoleList }).catch(log.warn);
  }

  private _handleError = (err: Error) => {
    console.warn("Console discovery server error: ", err);
    this.stopScanning();
  };

  public async startScanning() {
    if (this.server) {
      // Do nothing if server is already set
      return;
    }

    this.server = dgram.createSocket({ type: "udp4", reuseAddr: true });
    const server = this.server;

    server.on("error", this._handleError);
    server.on("message", this._handleMessageReceive);

    // Used to test receive handling code
    // server.on('listening', () => {
    //   const address = server.address();
    //   console.log(`server listening ${address.address}:${address.port}`);
    //   const client = dgram.createSocket("udp4");
    //   client.bind(null, null, () => {
    //     // client.bind(41234, "255.255.255.255");
    //     client.setBroadcast(true);

    //     const message = Buffer.concat([
    //       Buffer.from("SLIP_READY"),
    //       Buffer.from([1, 2, 3, 4, 5, 6]),
    //       Buffer.from("MY CONSOLE NICKNAME\0"),
    //     ]);

    //     client.send(message, 0, message.length, 20582, "255.255.255.255", (err, bytes) => {
    //       console.log({
    //         err: err,
    //         bytes: bytes,
    //       });
    //     });
    //   });
    // });

    // Bind to the broadcast address
    server.bind(20582);
  }

  public stopScanning() {
    if (!this.server) {
      // Nothing to do if server already disconnected
      return;
    }

    this.server.close();
    this.server.removeAllListeners();
    this.server = null;
  }
}

export const connectionScanner = new ConnectionScanner();
