'use strict'

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
    if (error || sourceError) {
      return this.sink.next('error', error)
    }

    // read into buffer
    if (more) {
      this.sink.next('continue', null, buffer, bytesWritten)
    } else {
      this.sink.next('end', null, buffer, bytesWritten)
    }
  }
}

module.exports = Source
