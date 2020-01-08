'use strict'

const { Buffer } = require('buffer')
const util = require('util')
const Status = require('../../reference-status-enum')

class AssertionSink {
  constructor (assertions_queue, encoding) { // eslint-disable-line camelcase
    this.source = null
    this.exitCb = null

    this._encoding = encoding
    this._queue_index = 0
    this._assertions_queue = assertions_queue // eslint-disable-line camelcase
  }

  bindSource (source) {
    this.source = source

    this.source.bindSink(this)

    return this
  }

  start (exitCb) {
    this.exitCb = exitCb

    this.source.pull(null, Buffer.alloc(this._assertions_queue[this._queue_index].length))
  }

  next (status, error, buffer, bytes) {
    if (status === Status.error) return this.exitCb(error)

    const buf = this._encoding ? buffer.slice(0, bytes).toString(this._encoding) : buffer.slice(0, bytes)

    // console.log(`AssertionSink ${this._queue_index}:\ndata  : ` +
    // util.inspect(buf, { colors: true }) +
    // '\nwanted: ' +
    // util.inspect(this._assertions_queue[this._queue_index], { colors: true }) +
    // '\nstatus: ' + Status[status])

    if (!util.isDeepStrictEqual(this._assertions_queue[this._queue_index], buf)) {
      error = new Error(
        `AssertionSink ${this._queue_index} failed:\ndata  : ` +
        util.inspect(buf, { colors: true }) +
        '\nwanted: ' +
        util.inspect(this._assertions_queue[this._queue_index], { colors: true })
      )
      if (status === Status.end) {
        return this.exitCb(error)
      } else {
        return this.source.pull(error, Buffer.alloc(0))
      }
    }

    if (status === Status.end) return this.exitCb()

    this._queue_index++
    if (this._queue_index === this._assertions_queue.length) {
      return this.source.pull(null, Buffer.alloc(0))
    }

    this.source.pull(null, Buffer.alloc(this._assertions_queue[this._queue_index].length))
  }
}

module.exports = AssertionSink
