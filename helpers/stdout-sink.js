'use strict'

const { Buffer } = require('buffer')
const Status = require('bob-status')

class StdoutSink {
  constructor (encoding) {
    this.source = null
    this.exitCb = null

    this.encoding = encoding

    try {
      this._buffer = Buffer.allocUnsafe(64 * 1024)
    } catch (error) {
      this._allocError = error
    }
  }

  bindSource (source) {
    this.source = source
    this.source.bindSink(this)
    return this
  }

  start (exitCb) {
    if (this._allocError) {
      return exitCb(this._allocError)
    }
    this.exitCb = exitCb

    this.source.pull(null, this._buffer)
  }

  next (status, error, buffer, bytes) {
    if (status === Status.error || error) {
      return this.exitCb(error)
    }

    buffer = buffer.slice(0, bytes)
    if (this.encoding) {
      process.stdout.write(buffer.toString(this.encoding))
    } else {
      process.stdout.write(buffer)
    }

    if (status === Status.end) {
      process.stdout.write('\n')
      this.exitCb(null)
    } else {
      this.source.pull(null, this._buffer)
    }
  }
}

module.exports = StdoutSink
