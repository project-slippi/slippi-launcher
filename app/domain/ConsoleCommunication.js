import { decode } from "@shelacek/ubjson";

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

  getMessages() {
    const toReturn = this.messages;
    this.messages = [];

    return toReturn;
  }
}