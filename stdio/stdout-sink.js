'use strict'

const { Buffer } = require('buffer')

class StdoutSink {
  constructor () {
    this.source = null
    this.bindCb = null

    try {
      this._buffer = Buffer.allocUnsafe(64 * 1024)
    } catch (error) {
      this._allocError = error
    }
  }

  bindSource (source, bindCb) {
    if (this._allocError) {
      return bindCb(this._allocError)
    }

    this.source = source
    this.bindCb = bindCb

    this.source.bindSink(this)

    this.source.pull(null, this._buffer)
  }

  next (status, error, buffer, bytes) {
    if (status === 'end') return
    if (error) bindCb(error)

    process.stdout.write(buffer.slice(0, bytes))

    this.source.pull(null, this._buffer)
  }
}

module.exports = StdoutSink
