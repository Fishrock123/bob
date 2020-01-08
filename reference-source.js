'use strict'

const Status = require('./reference-status-enum')

class Source {
  constructor () {
    this.sink = null
  }

  bindSink (sink) {
    // sink MUST be a data sink with a next(status, error, buffer, bytes) function
    this.sink = sink
  }

  pull (error, buffer) {
    // error MUST be null or an error
    // buffer MUST be a Buffer
    if (error) {
      return this.sink.next(Status.error, error)
    }

    // if there was an error reading or processing the buffer...
    const sourceError = new Error()
    if (sourceError) {
      return this.sink.next(Status.error, error)
    }

    // read into buffer
    const more = true // If there is more to be read
    const bytesWritten = 0 // Number of bytes written to the buffer

    if (more) {
      this.sink.next(Status.continue, null, buffer, bytesWritten)
    } else {
      this.sink.next(Status.end, null, buffer, bytesWritten)
    }
  }
}

module.exports = Source
