'use strict'

const util = require('util')
const debuglog = util.debuglog('bob')

const { Duplex } = require('stream')
const status_type = require('bob-status')

const kWriteCallback = Symbol('write callback')
const kDestroyCallback = Symbol('destroy callback')
const kErrored = Symbol('errored')

class BobDuplex extends Duplex {
  source = null
  sink = null

  constructor(options = { autoDestroy: true }) {
    if (options.autoDestroy === undefined) {
      options.autoDestroy = true
    }

    super(options)

    this.name = options.name

    // Stream callbacks we may need to store until later in a bob flow.
    this[kWriteCallback] = null
    this[kDestroyCallback] = null
    this[kErrored] = false

    // Begin paused so we wait for pull.
    this.cork()
  }

  _write(chunk, encoding, callback) {
    debuglog(`_WRITE ${this.name}`, arguments)

    if (this[kWriteCallback] !== null) {
      throw new Error('_write called again before callback was called')
    }

    if (!Buffer.isBuffer(chunk)) {
      chunk = Buffer.from(chunk)
    }

    // Store callback so we can call it when pull is called.
    this[kWriteCallback] = callback

    // Pause and wait for pull.
    this.cork()

    // Send data to our sink.
    this.sink.next(status_type.continue, null, chunk, chunk.length)
  }

  _read (size) {
    debuglog(`_READ ${this.name}`, arguments)

    // Allocate a sized buffer and pull.
    // (Since pull() does not presently have any 'size' argument.)
    this.source.pull(null, Buffer.alloc(size))
  }

  _destroy (err, cb) {
    debuglog(`_DESTROY ${this.name}`, arguments)

    if (this[kDestroyCallback] !== null) {
      throw new Error('_destroy called twice')
    }

    if (err) {
      this[kErrored] = true

      // If there is an error and we have a source, we want to propogate
      // the error upwards so all sources can close.
      // Store the callback for when the error returns to this component.
      if (this.source !== null) {
        this.source.pull(err)
        this[kDestroyCallback] = cb
      }
    } else {
      // No error, nothing really to do.
      // XXX(Fishrock): Does BOB need to support propogating a close upwards due to Streams3?
      cb()
    }
  }

  _final (cb) {
    debuglog(`_FINAL ${this.name}`)

    // Called when a chain of Steams3 streams closes, so send an 'end'.
    this.sink.next(status_type.end, null, Buffer.alloc(0), 0)

    // XXX(Jeremiah) No good spot to do this. Do it here I guess.
    // Maybe this should be in a nextTick or Immediate. No clue.
    cb()
  }

  bindSource (source) {
    debuglog(`BIND ${this.name} to ${source}`)

    source.bindSink(this)
    this.source = source

    return this
  }

  bindSink (sink) {
    this.sink = sink
  }

  next (status, error, buffer, bytes) {
    debuglog(`NEXT ${this.name}`, status_type[status], arguments)

    // If there was a destroy callback we were not getting data,
    // but rather attempting to close things with an error.
    if (this[kDestroyCallback]) {
      debuglog('destroy callback')

      this[kDestroyCallback]()
      return
    }

    // If we have an error and have not already been in error state, emit it Streams3 style.
    if (error !== null) {
      if (this[kErrored] === false) {
        this[kErrored] = true
        this.emit('error', error)
      }
      return
    }

    // Regular data case.
    if (status === status_type.continue) {
      this.push(buffer.slice(0, bytes))
      return
    }

    // End from upstream source.
    if (status === status_type.end) {
      debuglog(`END in ${this.name} next()`)

      // Push a last chunk only if we have one with any written data.
      if (bytes > 0) {
        this.push(buffer.slice(0, bytes))
      }
      this.push(null)
      return
    }

    // If we get to here something is very wrong.
    throw new Error(`Invalid status without an error: ${status}`)
  }

  pull (error, buffer) {
    debuglog(`PULL ${this.name}`, arguments, this[kWriteCallback])

    // Clear the stored write cb to prepare for another.
    const writeCb = this[kWriteCallback]
    this[kWriteCallback] = null

    // We are ready for data, unpause.
    this.uncork()

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

module.exports = BobDuplex
