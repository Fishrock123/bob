'use strict'

class Source {
  constructor () {
    this.sink = null
  }

  bindSink (sink) {
    // sink MUST be a data sink with a next(status, error, buffer, bytes) function
    this.sink = sink
  }

  read (error, buffer) {
    // error MUST be null or an error
    // buffer MUST be a Buffer
    if (error || sourceError) {
      return this.source.next('error', error)
    }

    // read into buffer
    if (more) {
      this.source.next('continue', null, buffer, bytesWritten)
    } else {
      this.source.next('end', null, buffer, bytesWritten)
    }
  }
}

module.exports = Source
