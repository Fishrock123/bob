'use strict'

class Stream {
  #source = null
  #sink = null
  #promise = null
  #resolve = null
  #reject = null

  constructor(source, ...sinks) {
    this.#source = source
    this.#sink = sinks[sinks.length - 1]

    let last = source
    for (const sink of sinks.slice(0, sinks.length - 1)) {
      sink.bindSource(last)
      last = sink
    }

    this.#sink.bindSource(last, error => {
      if (this.#promise === null) {
        throw error
      }
      if (error) {
        this.#reject(error)
      } else {
        this.#resolve()
      }
    })
  }

  start() {
    // If sink is undefined or does not have start(), a programmer error has been made.
    return this.sink.start()
  }

  stop() {
    // If source is undefined or does not have stop(), a programmer error has been made.
    return this.source.stop()
  }

  then(_resolve, _reject) {
    if (!this.#promise) {
      this.#promise = new Promise((resolve, reject) => {
        this.#resolve = resolve
        this.#reject = reject
      })
    }
    return this.#promise.then(_resolve, _reject)
  }
}

module.exports = Stream
