'use strict'

const status_type = require('./reference-status-enum') // eslint-disable-line camelcase
const Source = require('./reference-source')

const kStopped = Symbol('stopped')

class StopExtensionSource extends Source {
  constructor () {
    super()

    this[kStopped] = false
  }

  stop () {
    this[kStopped] = true
  }

  pull (error, buffer) {
    if (this[kStopped]) {
      this.sink.next(status_type.end, null, buffer, 0)
      return
    }

    super.pull(error, buffer)
    // See reference-source.js
  }
}

module.exports = StopExtensionSource
