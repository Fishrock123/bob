'use strict'

const Status = require('../reference-status-enum')
const ReadableSink = require('./readable-sink')

class StdoutSink {
  constructor (encoding) {
    this.source = null
    this.exitCb = null

    this.encoding = encoding

    this._sink = null
  }

  bindSink (sink) {
    this._sink = sink
  }

  bindSource (source) {
    this.source = source
    this.source.bindSink(this)

    const sink = new ReadableSink({ encoding: this.encoding })
    sink.bindSource(this)

    return this
  }

  start (exitCb) {
    this.exitCb = exitCb

    this._sink.pipe(process.stdout)
  }

  next (status, error, buffer, bytes) {
    if (status === Status.error || error) {
      this.exitCb(error)
    }
    this._sink.next(status, error, buffer, bytes)
  }

  pull (error, buffer) {
    this.source.pull(error, buffer)
  }
}

module.exports = StdoutSink
