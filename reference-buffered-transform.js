'use strict'

const { Buffer } = require('buffer')
const Status = require('./reference-status-enum')

class BufferedTransform {
  constructor (bufferSize, reallocateSize) {
    this.sink = null
    this.source = null

    this._buffer = Buffer.allocUnsafe(bufferSize)
    this._bytes = 0
    this._readPos = 0
    this._reallocateSize = reallocateSize || bufferSize
  }

  bindSource (source) {
    source.bindSink(this)
    this.source = source

    return this
  }

  bindSink (sink) {
    this.sink = sink
  }

  next (status, error, buffer, bytes) {
    if (status === Status.error) {
      return this.sink.next(status, error)
    }
    if (status === Status.end) {
      // Flush
      return this.sink.next(status, null, this._buffer, this._bytes)
    }

    if (this._bytes + bytes > this._buffer.length) {
      const prevBuffer = this._buffer
      const reallocSize = this._buffer.length + this._reallocateSize
      const neededSize = this._bytes + bytes
      this._buffer = Buffer.allocUnsafe(neededSize > reallocSize ? neededSize + reallocSize : reallocSize)
      prevBuffer.copy(this._buffer, 0, 0, neededSize)
    }

    buffer.copy(this._buffer, this._bytes, 0, bytes)
    this._bytes += bytes

    if (status === Status.continue) {
      return this.source.pull(null, buffer)
    }
  }

  pull (error, buffer) {
    if (error !== null || this._bytes === 0) {
      return this.source.pull(error, buffer)
    }

    if (this._readPos >= this._bytes) {
      this.sink.next(Status.end)
    }

    this._buffer.copy(buffer, 0, this._readPos)

    this._readPos += buffer.length

    this.sink.next(Status.continue, null, buffer, buffer.length)
  }
}

module.exports = BufferedTransform
