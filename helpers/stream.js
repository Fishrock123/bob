'use strict'

class Stream {
  source = null
  sink = null
  promise = null
  resolve = null
  reject = null
  bindCb = null

  constructor(...components) {
    const last = components.length - 1
    const source = this.source = components[0]
    const sink = this.sink = components[last]

    let above = source // Above the next sink in the flow
    for (const intermediate of components.slice(1, last)) {
      above = intermediate.bindSource(above)
    }

    if (typeof sink.pull !== 'function') {
      sink.bindSource(above, error => {
        if (typeof this.bindCb === 'function') {
          this.bindCB(error)
        }

        if (this.promise === null) {
          if (error) throw error
          else return
        }
        if (error) {
          this.reject(error)
        } else {
          this.resolve()
        }
      })
    } else {
      sink.bindSource(above)
    }
  }

  start() {
    // If sink is undefined or does not have start(), a programmer error has been made.
    this.sink.start()
    return this
  }

  stop() {
    // If source is undefined or does not have stop(), a programmer error has been made.
    this.source.stop()
    return this
  }

  then(_resolve, _reject) {
    if (!this.promise) {
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    }
    return this.promise.then(_resolve, _reject)
  }

  bindSource (source, bindCb) {
    if (this.bindCb) throw new Error('Already bound Stream')
    this.bindCb = bindCb
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
