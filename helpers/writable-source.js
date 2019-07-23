'use strict'

const util = require('util')
const debuglog = util.debuglog('bob')

const { Writable } = require('readable-stream')
const status_type = require('../reference-status-enum') // eslint-disable-line camelcase

const kWriteCallback = Symbol('WritableSource write callback')
const kDestroyCallback = Symbol('WritableSource destroy callback')
const kFinalCallback = Symbol('WritableSource final callback')
const kErrored = Symbol('WritableSource errored')
const kEnding = Symbol('WritableSource ending')
const kEnded = Symbol('WritableSource ended')
const kPulling = Symbol('WritableSource pulling')

class WritableSource extends Writable {
  // Streams3 <-> BOB interface

  constructor (options = { autoDestroy: true }) {
    if (options.autoDestroy === undefined) {
      options.autoDestroy = true
    }

    super(options)

    this.sink = null

    this.name = options.name

    // Stream callbacks we may need to store until later in a bob flow.
    this[kWriteCallback] = null
    this[kDestroyCallback] = null
    this[kFinalCallback] = null
    this[kErrored] = false
    this[kEnded] = false
    this[kPulling] = false
  }

  _write (chunk, encoding, callback) {
    debuglog(`_WRITE ${this.name}`, arguments)

    if (this[kWriteCallback] !== null) {
      throw new Error('_write called again before callback was called')
    }

    if (this[kEnded]) {
      if (this[kFinalCallback] === null) {
        // _write should not have happened.
        const error = new Error('write happened but stream was ended without a final callback')
        process.nextTick(_ => this.emit('error', error))
      }
      return
    }

    if (!Buffer.isBuffer(chunk)) {
      const encoding = this._readableState.encoding || this._readableState.defaultEncoding
      chunk = Buffer.from(chunk, encoding)
    }

    // Store callback so we can call it when pull is called.
    this[kWriteCallback] = callback

    this[kPulling] = false

    // Send data to our sink.
    this.sink.next(status_type.continue, null, chunk, chunk.length)
  }

  _destroy (err, cb) {
    debuglog(`_DESTROY ${this.name}`, arguments)

    if (this[kDestroyCallback] !== null) {
      throw new Error('_destroy called twice')
    }

    this[kDestroyCallback] = cb
    this[kEnding] = true

    if (err) {
      this[kErrored] = true
      // If there is an error and we have a source, we want to propogate
      // the error upwards so all sources can close.
      // Store the callback for when the error returns to this component.
      this.sink.next(status_type.error, err, Buffer.alloc(0), 0)
    }
    // Otherwise wait for _final (?)
  }

  _final (cb) {
    debuglog(`_FINAL ${this.name}`)

    this[kEnded] = true

    if (this[kPulling]) {
      // Called when a chain of Steams3 streams closes, so send an 'end'.
      this.sink.next(status_type.end, null, Buffer.alloc(0), 0)
      cb()
    } else {
      // Hope that a pull is made...
      this[kFinalCallback] = cb
    }
  }

  bindSink (sink) {
    this.sink = sink
  }

  pull (error, buffer) {
    debuglog(`PULL ${this.name}`, arguments, this[kWriteCallback])

    if (this[kPulling]) {
      throw new Error('WritableSource: pull already in progress!')
    }

    this[kPulling] = true

    if (typeof this[kFinalCallback] === 'function') {
      if (error) {
        this.sink.next(status_type.error, error, Buffer.alloc(0), 0)
        this[kFinalCallback](error)
      } else {
        this.sink.next(status_type.end, null, Buffer.alloc(0), 0)
        this[kFinalCallback]()
      }
      return
    }

    if (this[kErrored]) {
      // Something is probably very wrong if this happens...
      error = error || new Error('WritableSource: already in error state')
      // XXX(Jeremiah): Maybe just send this to the sink directly?
      this.destroy(error)
      return
    }

    // Clear the stored write cb to prepare for another.
    const writeCb = this[kWriteCallback]
    this[kWriteCallback] = null

    // If we don't yet have a write callback from an attempted Streams3 write, just bail.
    if (!writeCb) {
      // Except if there is already an error in which case attempt to teardown.
      if (error) {
        this.destroy(error)
      }
      return
    }

    // Let Streams3 know we are done writing.
    writeCb(error)
  }
}

module.exports = WritableSource
