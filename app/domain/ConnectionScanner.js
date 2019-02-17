import dgram from 'dgram';
import _ from 'lodash';
import moment from 'moment';

import { store } from '../index';
import { connectionStateChanged } from '../actions/console';

export default class ConnectionScanner {
  constructor() {
    this.isScanning = false;
    this.availableConnectionsByIp = {};
    this.server = null;

    // TODO: Remove
    // this.availableConnectionsByIp = {
    //   '192.168.1.500': {
    //     'ip': '192.168.1.500',
    //     'mac': '1241:4214',
    //     'name': "Station Foo",
    //     'firstFound': moment(),
    //   },
    //   '192.168.1.501': {
    //     'ip': '192.168.1.501',
    //     'mac': '1241:4214',
    //     'name': "Station Bar",
    //     'firstFound': moment(),
    //   },
    //   '192.168.1.42': {
    //     'ip': '192.168.1.42',
    //     'mac': '1241:4214',
    //     'name': "Station Zoob",
    //     'firstFound': moment(),
    //   },
    // };
  }

  forceConsoleUiUpdate() {
    store.dispatch(connectionStateChanged());
  }

  getAvailable() {
    return this.availableConnectionsByIp;
  }

  getIsScanning() {
    return !!this.server;
  }

  handleMessageReceive = (msg, rinfo) => {
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
      mac.push(msg.readUInt8(i).toString(16).padStart(2, '0'));
    }
    const macAddr = `${mac[0]}:${mac[1]}:${mac[2]}:${mac[3]}:${mac[4]}:${mac[5]}`;

    // Broadcast 'command' string
    const cmd = msg.slice(0, 10).toString('ascii');
    console.log(`Got broadcast ${cmd} from ${rinfo.address}:${rinfo.port}`);

    // Console nickname string
    const nick = msg.slice(16, 48).toString().split("\0").shift();

    // The Wii's IP address
    const ip = rinfo.address;

    const previous = _.get(this.availableConnectionsByIp, ip);
    const previousTimeoutHandler = _.get(previous, 'timeout');
    const previousFirstFound = _.get(previous, 'firstFound');

    // If we have received a new message from this IP, clear the previous 
    // timeout hanlder so that this IP doesn't get removed
    if (previousTimeoutHandler) {
      clearTimeout(previousTimeoutHandler);
    }

    // If we don't get a message for 35 seconds, remove from list
    const timeoutHandler = setTimeout(() => {
      delete this.availableConnectionsByIp[ip];
      this.forceConsoleUiUpdate();
    }, 35000);

    this.availableConnectionsByIp[ip] = {
      'ip': ip,
      'mac': macAddr,
      'name': nick,
      'timeout': timeoutHandler,
      'firstFound': previousFirstFound || moment(),
    };
    
    // Force UI update to show new connection
    this.forceConsoleUiUpdate();
  }

  handleError = (err) => {
    console.log(`server error:\n${err.stack}`);
    this.stopScanning();
  }

  async startScanning() {
    if (this.server) {
      // Do nothing if server is already set
      return;
    }

    this.server = dgram.createSocket({ type: 'udp4', reuseAddr: true});
    const server = this.server;

    server.on('error', this.handleError);
    server.on('message', this.handleMessageReceive);

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
    this.forceConsoleUiUpdate();
    await server.bind(20582);
  }

  stopScanning() {
    if (!this.server) {
      // Nothing to do if server already disconnected
      return;
    }

    this.server.close();
    this.server.removeAllListeners();
    this.server = null;

    this.forceConsoleUiUpdate();
  }
}
