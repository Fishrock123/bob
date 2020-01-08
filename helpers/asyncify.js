'use strict'

class Asyncify {
  constructor () {
    this.sink = null
    this.source = null
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
    process.nextTick(_ => this.sink.next(status, error, buffer, bytes))
  }

  pull (error, buffer) {
    process.nextTick(_ => this.source.pull(error, buffer))
  }
}

module.exports = Asyncify
