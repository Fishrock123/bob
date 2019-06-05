'use strict'

const status_type = require('./status-enum')

class Source {
  constructor () {
    this.sink = null
  }

  bindSink (sink) {
    // sink MUST be a data sink with a next(status, error, buffer, bytes) function
    this.sink = sink
  }

  pull (error, buffer, offset) {
    // error MUST be null or an error
    // buffer MUST be a Buffer
    // if offset exists, use it if possible
    if (error || sourceError) {
      return this.sink.next(status_type.error, error)
    }

    // read into buffer
    if (more) {
      this.sink.next(status_type.continue, null, buffer, bytesWritten)
    } else {
      this.sink.next(status_type.end, null, buffer, bytesWritten)
    }
  }
}

module.exports = Source
