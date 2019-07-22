'use strict'

const util = require('util')
const debuglog = util.debuglog('bob')

const { Writable } = require('readable-stream')
const status_type = require('../reference-status-enum') // eslint-disable-line camelcase

const kWriteCallback = Symbol('write callback')
const kDestroyCallback = Symbol('destroy callback')
const kFinalCallback = Symbol('final callback')
const kErrored = Symbol('errored')
const kEnded = Symbol('ended')
const kPulling = Symbol('pulling')

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

    // Begin paused so we wait for pull.
    // this.cork()
  }

  _write (chunk, encoding, callback) {
    debuglog(`_WRITE ${this.name}`, arguments)

    if (this[kWriteCallback] !== null) {
      throw new Error('_write called again before callback was called')
    }

    if (this[kEnded]) {
      if (this[kFinalCallback] === null) {
        throw new Error('write happened but stream was ended without a final callback')
      }
      this.sink.next(status_type.end, null, Buffer.alloc(0), 0)
      this[kFinalCallback]()
      return
    }

    if (!Buffer.isBuffer(chunk)) {
      const encoding = this._readableState.encoding || this._readableState.defaultEncoding
      chunk = Buffer.from(chunk, encoding)
    }

    // Store callback so we can call it when pull is called.
    this[kWriteCallback] = callback

    // Pause and wait for pull.
    // this.cork()

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
    this[kErrored] = true

    if (err) {
      // If there is an error and we have a source, we want to propogate
      // the error upwards so all sources can close.
      // Store the callback for when the error returns to this component.
      this.source.pull(err)
    } else {
      // No error, but need to propogate a forced close anyways.
      // XXX(Fishrock): Does BOB need to support propogating a close upwards due to Streams3?
      // XXX(Fishrock): Use extension-stop?
      this.source.pull(new Error('BobDuplex: user called stream.destroy()'))
    }
  }

  _final (cb) {
    debuglog(`_FINAL ${this.name}`)

    this[kEnded] = true

    if (this[kPulling]) {
      // Called when a chain of Steams3 streams closes, so send an 'end'.
      this.sink.next(status_type.end, null, Buffer.alloc(0), 0)
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

    this[kPulling] = true

    if (this[kFinalCallback]) {
      this.sink.next(status_type.end, null, Buffer.alloc(0), 0)
      return
    }

    // Clear the stored write cb to prepare for another.
    const writeCb = this[kWriteCallback]
    this[kWriteCallback] = null

    // We are ready for data, unpause.
    // this.uncork()

    // If we don't yet have a write callback from an attempted Streams3 write, just bail.
    if (!writeCb) {
      // Except if there is already an error in which case emit it Streams3 style.
      if (error) {
        this[kErrored] = true
        this.emit('error', error)
      }
      return
    }

    // Let Streams3 know we are done writing.
    if (error) {
      writeCb(error)
    } else {
      writeCb()
    }
  }
}

module.exports = WritableSource
