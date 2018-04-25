'use strict'

const { Buffer } = require('buffer')
const status_type = require('../status-enum')

class Sink {
  constructor () {
    this.source = null
    this.bindCb = null
  }

  bindSource (source, bindCb) {
    // source MUST be a data source with a read(err, buffer) function
    // bindCb MUST be a function with an error argument

    this.source = source
    this.bindCb = bindCb

    // Critically important
    this.source.bindSink(this)

    // start reading
    // sink handles buffer allocation
    const buffer = new Buffer(0)

    this.source.pull(null, buffer)
  }

  next (status, error, buffer, bytes) {
    // status MUST be a valid status indicator (string currently)
    //  options are: status_type.error, status_type.continue, or status_type.end
    // error MUST be null or an error
    // buffer MUST be a Buffer
    // bytes MUST be the number of bytes read

    if (error) {
      // cleanup
      return bindCb(error)
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
