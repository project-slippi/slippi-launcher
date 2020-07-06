export default class SlpFile {
  constructor({ path, writeStream, startTime }) {
    this.payloadSizes = {}
    this.previousBuffer = Buffer.from([])
    this._fullBuffer = Buffer.from([])
    this._buffersToConcat = []
    this.lastIndex = 0
    this.path = path || null
    this.writeStream = writeStream || null
    this.bytesWritten = 0
    this.metadata = {
      startTime: startTime || null,
      lastFrame: -124,
      players: {},
    }
  }

  get fullBuffer() {
    if (this._buffersToConcat.length > 0) {
      this._fullBuffer = Buffer.concat([this._fullBuffer, ...this._buffersToConcat])
    }
    this._buffersToConcat = []
    return this._fullBuffer
  }

  addBuffer(buffer) {
    this.buffersToConcat.push(buffer)
  }
}

