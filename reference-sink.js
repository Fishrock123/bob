'use strict'

const { Buffer } = require('buffer')
const Status = require('./reference-status-enum')

class Sink {
  constructor () {
    this.source = null
    this.exitCb = null
  }

  bindSource (source) {
    // source MUST be a data source with a read(err, buffer) function
    this.source = source

    // Critically important
    this.source.bindSink(this)
  }

  start (exitCb) {
    // exitCb MUST be a function with an error argument
    this.exitCb = exitCb

    // start reading
    // sink handles buffer allocation
    const buffer = Buffer.alloc(0)

    this.source.pull(null, buffer)
  }

  next (status, error, buffer, bytes) {
    // status MUST be a valid status indicator (string currently)
    //  options are: Status.error, Status.continue, or Status.end
    // error MUST be null or an error
    // buffer MUST be a Buffer
    // bytes MUST be the number of bytes read

    if (error || status === Status.end) {
      // cleanup
      return this.exitCb(error)
    }

    // write or process buffer here

    // if there was an error writing or processing the buffer...
    const sinkError = new Error()
    if (sinkError) {
      return this.source.pull(error)
    }

    // pull again
    // sink handles buffer allocation
    const buf = Buffer.alloc(0)

    this.source.pull(null, buf)
  }
}

module.exports = Sink
