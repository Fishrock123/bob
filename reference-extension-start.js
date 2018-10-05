'use strict'

const { Buffer } = require('buffer')
const Sink = require('./reference-sink')

class StartExtensionSink extends Sink {
  constructor () {
    super()
  }

  start () {
    // Additional options may be passed if the Sink accepts any.

    // start reading
    // sink handles buffer allocation
    const buffer = new Buffer(0)

    this.source.pull(null, buffer)
  }
}

module.exports = StartExtensionSink
