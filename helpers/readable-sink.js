'use strict'

const util = require('util')
const debuglog = util.debuglog('bob')

const { Readable } = require('readable-stream')
const status_type = require('../reference-status-enum') // eslint-disable-line camelcase

const kDestroyCallback = Symbol('ReadableSink destroy callback')
const kErrored = Symbol('ReadableSink errored')

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
    this[kDestroyCallback] = null
    this[kErrored] = false
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
      throw new Error('ReadableSink: _destroy called twice')
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
      this.source.pull(new Error('ReadableSink: user called stream.destroy()'))
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

      this[kDestroyCallback](error)
      return
    }

    // If we have an error and have not already been in error state, emit it Streams3 style.
    if (error !== null) {
      if (this[kErrored] === false) {
        this[kErrored] = true
        this.destory(error)
      }
      return
    }

    // Data cases.

    // Push a chunk only if anything was written.
    if (bytes > 0) {
      this.push(buffer.slice(0, bytes))
    }

    // Regular case.
    if (status === status_type.continue) {
      return
    }

    // End from upstream source.
    if (status === status_type.end) {
      debuglog(`END in ${this.name} next()`)

      this.push(null)
      return
    }

    // If we get to here something is very wrong.
    error = new Error(`ReadableSink: Invalid status without an error: ${status}`)
    this.destory(error)
  }
}

module.exports = ReadableSink
