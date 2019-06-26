'use strict'

const { Buffer } = require('buffer')
const status_type = require('./status-enum')

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
    const buffer = new Buffer(0)

    this.source.pull(null, buffer, 0)
  }

  next (status, error, buffer, bytes) {
    // status MUST be a valid status indicator (string currently)
    //  options are: status_type.error, status_type.continue, or status_type.end
    // error MUST be null or an error
    // buffer MUST be a Buffer
    // bytes MUST be the number of bytes read

    if (error || status === status_type.end) {
      // cleanup
      return exitCb(error)
    }

    // write or process buffer here

    // if there was an error writing or processing the buffer...
    if (sinkError) {
      return this.source.pull(error)
    }

    // pull again
    // sink handles buffer allocation
    const buffer = new Buffer(0)

    this.source.pull(null, buffer)
  }
}

module.exports = Sink
