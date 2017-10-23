'use strict'

const { Buffer } = require('buffer')

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

    this.source.bindSink(this)

    // possibly start reading
    this._read()
  }

  next (status, error, buffer, bytes) {
    // status MUST be a valid status indicator (string currently)
    //  options are: 'error', 'continue', or 'end'
    // error MUST be null or an error
    // buffer MUST be a Buffer
    // bytes MUST be the number of bytes read

    if (error) {
      // cleanup
      return bindCb(error)
    }

    // write or process buffer

    if (sinkError) {
      return this.source.read(error)
    }

    this._read()
  }

  // unecessary but de-duplicates code, not considered "sink api"
  _read() {
    // sink handles buffer allocation
    const buffer = new Buffer(0)

    this.source.read(null, buffer)
  }
}

module.exports = Sink
