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
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

    /* The structure of broadcast messages from the Wii should be:
     *
     *		unsigned char	cmd[10];      //SLIP_READY
     *		u8		mac_addr[6];  // MAC address
     *		unsigned char	nickname[32]; //interpret in ASCII
     */

    const ip = rinfo.address;

    const previous = _.get(this.availableConnectionsByIp, ip);
    const previousTimeoutHandler = _.get(previous, 'timeout');
    const previousFirstFound = _.get(previous, 'firstFound');

    if (previousTimeoutHandler) {
      // If we have received a new message from this IP, clear
      // the previous timeout hanlder so that this IP doesn't
      // get removed
      clearTimeout(previousTimeoutHandler);
    }

    // If we don't get a message for 20 seconds, remove from list
    const timeoutHandler = setTimeout(() => {
      delete this.availableConnectionsByIp[ip];
      this.forceConsoleUiUpdate();
    });

    this.availableConnectionsByIp[ip] = {
      'ip': ip,
      'mac': msg.macAddress,
      'name': msg.name,
      'timeout': timeoutHandler,
      'firstFound': previousFirstFound || moment(),
    };
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

    // server.on('listening', () => {
    //   const address = server.address();
    //   console.log(`server listening ${address.address}:${address.port}`);
    // });

    // Bind to the broadcast address
    this.forceConsoleUiUpdate();
    await server.bind({
      address: '255.255.255.255',
      port: 20582,
    });
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
