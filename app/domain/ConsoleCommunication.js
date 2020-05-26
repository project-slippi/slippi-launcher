/*

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program; if not, write to the Free Software Foundation,
Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

*/


import { decode, encode } from "@shelacek/ubjson";

export const types = {
  HANDSHAKE: 1,
  REPLAY: 2,
  KEEP_ALIVE: 3,
};

// This class is responsible for handling the communication protocol between the Wii and the
// desktop app
export default class ConsoleCommunication {
  constructor() {
    this.receiveBuf = Buffer.from([]);
    this.messages = [];
  }

  receive(data) {
    this.receiveBuf = Buffer.concat([
      this.receiveBuf,
      data,
    ]);

    while (this.receiveBuf.length >= 4) {
      // First get the size of the message we are expecting
      const msgSize = this.receiveBuf.readUInt32BE(0);

      if (this.receiveBuf.length < msgSize + 4) {
        // If we haven't received all the data yet, let's wait for more
        return;
      }

      // Here we have received all the data, so let's decode it
      const ubjsonData = this.receiveBuf.slice(4, msgSize + 4);
      this.messages.push(decode(ubjsonData));

      // Remove the processed data from receiveBuf
      this.receiveBuf = this.receiveBuf.slice(msgSize + 4);
    }
  }

  // Should likely only be used for debugging purposes
  getReceiveBuffer() {
    return this.receiveBuf;
  }

  getMessages() {
    const toReturn = this.messages;
    this.messages = [];

    return toReturn;
  }

  genHandshakeOut(cursor, clientToken, isRealtime=false) {
    const clientTokenBuf = Buffer.from([0, 0, 0, 0]);
    clientTokenBuf.writeUInt32BE(clientToken, 0);

    const message = {
      type: types.HANDSHAKE,
      payload: {
        cursor: cursor,
        clientToken: Uint8Array.from(clientTokenBuf), // TODO: Use real instance token
        isRealtime: isRealtime,
      },
    };

    const buf = encode(message, {
      optimizeArrays: true,
    });

    const msg = Buffer.concat([
      Buffer.from([0, 0, 0, 0]),
      Buffer.from(buf),
    ]);

    msg.writeUInt32BE(buf.byteLength, 0);

    // console.log({
    //   char: msg.toString("ascii", 80, 81),
    //   isRealtime: isRealtime,
    //   msg: msg,
    // });
    return msg;
  }
}