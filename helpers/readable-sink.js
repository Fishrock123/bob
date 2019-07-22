'use strict'

const util = require('util')
const debuglog = util.debuglog('bob')

const { Readable } = require('readable-stream')
const status_type = require('../reference-status-enum') // eslint-disable-line camelcase

const kWriteCallback = Symbol('write callback')
const kDestroyCallback = Symbol('destroy callback')
const kFinalCallback = Symbol('final callback')
const kErrored = Symbol('errored')
const kEnded = Symbol('ended')
const kPulling = Symbol('pulling')

class ReadableSink extends Readable {
  // Streams3 <-> BOB interface

  constructor (options = { autoDestroy: true }) {
    if (options.autoDestroy === undefined) {
      options.autoDestroy = true
    }

    super(options)

    this.source = null

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

  bindSource (source) {
    debuglog(`BIND ${this.name} to ${source}`)

    source.bindSink(this)
    this.source = source

    return this
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
}

module.exports = ReadableSink
