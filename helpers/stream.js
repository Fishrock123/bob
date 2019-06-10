'use strict'

class Stream {
  source = null
  sink = null

  constructor (...components) {
    const last = components.length - 1
    this.source = components[0]
    this.sink = components[last]

    let above = this.source // Above the next sink in the flow
    for (const intermediate of components.slice(1)) {
      above = intermediate.bindSource(above)
    }
  }

  start (exitCb) {
    // If sink is undefined a programmer error has been made.
    this.sink.start(exitCb)
    return this
  }

  stop () {
    // If source is undefined or does not have stop(), a programmer error has been made.
    this.source.stop()
    return this
  }

  // Implements a passthrough
  //
  // This is done to avoid having excess setup code to extract
  // "underlying" sources and sinks.

  bindSource (source) {
    return this.source.bindSource(source)
  }

  bindSink (sink) {
    return this.sink.bindSink(sink)
  }

  next (status, error, buffer, bytes) {
    this.source.next(status, error, buffer, bytes)
  }

  pull (error, buffer) {
    this.sink.pull(error, buffer)
  }
}

module.exports = Stream
