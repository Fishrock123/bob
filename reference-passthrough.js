'use strict'

class PassThrough {
  sink = null
  source = null

  constructor () {}

  bindSource (source) {
    source.bindSink(this)
    this.source = source

    return this
  }

  bindSink (sink) {
    this.sink = sink
  }

  next (status, error, buffer, bytes) {
    this.sink.next(status, error, buffer, bytes)
  }

  pull (error, buffer, offset) {
    this.source.pull(error, buffer, offset)
  }
}

module.exports = PassThrough
