'use strict'

class PassThrough {
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
    this.sink.next(status, error, buffer, bytes)
  }

  read (error, buffer) {
    this.source.read(error, buffer)
  }
}

module.exports = PassThrough
