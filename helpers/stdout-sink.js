'use strict'

const { Buffer } = require('buffer')
const status_type = require('bob-status') // eslint-disable-line camelcase

class StdoutSink {
  constructor () {
    this.source = null
    this.exitCb = null

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
    if (error || status === status_type.end) {
      return this.exitCb(error)
    }

    process.stdout.write(buffer.slice(0, bytes))

    this.source.pull(null, this._buffer)
  }
}

module.exports = StdoutSink
