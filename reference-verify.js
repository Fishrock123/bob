'use strict'

const status_type = require('./reference-status-enum') // eslint-disable-line camelcase
const { Buffer } = require('buffer')

const kHadEnd = Symbol('had end')
const kHadError = Symbol('had error')
const kSentError = Symbol('sent error')
const kPullInProgress = Symbol('pull in progress')
const kPullInProgressError = Symbol('pull in progress error')

class Verify {
  constructor () {
    this.sink = null
    this.source = null

    this[kHadEnd] = false
    this[kHadError] = false
    this[kSentError] = false
    this[kPullInProgress] = false
    this[kPullInProgressError] = null
  }

  bindSource (source) {
    if (this.source !== null) {
      throw new Error('[verify] already bound to a Source')
    }

    if (typeof source !== 'object') {
      throw new TypeError('[verify] source must be an object')
    }
    if (typeof source.pull !== 'function') {
      throw new TypeError('[verify] source must have a pull() function')
    }
    if (typeof source.bindSink !== 'function') {
      throw new TypeError('[verify] source must have a bindSink() function')
    }

    // `stop` must be a function if it exists on a source (extension-stop)
    if (source.stop !== undefined &&
        typeof source.stop !== 'function') {
      throw new TypeError(`[verify] extension-stop conflict with stop() property on source: ${source.stop}`)
    }

    source.bindSink(this)
    this.source = source

    return this
  }

  bindSink (sink) {
    if (this.sink !== null) {
      throw new Error('[verify] already bound to a Sink')
    }

    if (typeof sink !== 'object') {
      throw new TypeError('[verify] sink must be an object')
    }
    if (typeof sink.next !== 'function') {
      throw new TypeError('[verify] sink must have a next() function')
    }

    // Start() must always exist on non-passthroughs
    if (typeof sink.pull !== 'function' &&
        typeof sink.next !== 'function') {
      throw new TypeError('[verify] non-passthrough sink must have a start() function')
    }

    this.sink = sink
  }

  next (status, error, buffer, bytes) {
    checkBind(this)

    // console.error(`Verify.next [${status_type[status]}]`)

    if (this[kHadError]) {
      if (this[kSentError]) {
        return
      }

      this[kSentError] = true
      this.sink.next(status_type.error, error, buffer, bytes)
    }

    // next after end
    if (this[kHadEnd]) {
      throw new Error('[verify] next was called after stream ended')
    }

    // the proper place to notify of a multiple pull
    if (this[kPullInProgressError] !== null) {
      // console.error('Verify.next kPullInProgressError')
      this.source.pull(this[kPullInProgressError], Buffer.alloc(0))
      this[kPullInProgressError] = null
      return
    }

    try {
      // status
      if (typeof status !== 'number' &&
          status_type[status_type] === undefined) {
        throw new TypeError(`[verify] status passed to next() was not a valid status: ${status}`)
      }
      // error
      if (error !== null && !(error instanceof Error)) {
        throw new TypeError(`[verify] error passed to next() was non-null and not an Error: ${error}`)
      }
      if (error !== null && status !== status_type.error) {
        throw new TypeError(`[verify] error passed  to next() but status was not 'error', instead: ${status_type[status]}`)
      }
      // buffer
      if (error !== null && !Buffer.isBuffer(buffer)) {
        throw new TypeError(`[verify] buffer passed to next() was not a Buffer: ${buffer}`)
      }
      // bytes
      if (error !== null && typeof bytes !== 'number') {
        throw new TypeError(`[verify] bytes passed to next() was not a number: ${bytes}`)
      }
      // buffer and bytes are mutual
      if ((buffer && bytes === undefined) || (bytes !== undefined && !buffer)) {
        throw new TypeError(`[verify] buffer and bytes must be mutually provided`)
      }
    } catch (err) {
      this[kHadError] = true
      this.source.pull(err, Buffer.alloc(0))
      return
    }

    // duplicate or unwarrented next()
    if (!this[kPullInProgress]) {
      // If doing this explodes things were wrong enough to warrent it.
      this[kHadError] = true
      // console.error('Verify.next unwarrentedNext')
      this.source.pull(
        new Error('[verify] next() was called without a pull in progress'),
        Buffer.alloc(0)
      )
      return
    }

    this[kPullInProgress] = false

    if (status === status_type.end) {
      this[kHadEnd] = true
    }

    if (error !== null) {
      this[kHadError] = true
      this[kSentError] = true
    }

    this.sink.next(status, error, buffer, bytes)
  }

  pull (error, buffer) {
    checkBind(this)

    // console.error(`Verify.pull [${error}]`)

    // multiple pull()
    if (this[kPullInProgress]) {
      this[kPullInProgressError] = new Error(`[verify] a pull() was already in progress, came from: ${this.sink}`)
      return
    }
    this[kPullInProgress] = true

    // pull after errored
    if (this[kHadError]) {
      if (this[kSentError]) {
        return
      }
      // If this occurs all upstream components are already in a closed or errored state.
      // Return to the nearest available handler, the component which sent us the new pull.
      this[kSentError] = true
      this.sink.next(
        status_type.error,
        new Error(`[verify] verify has already tracked an error, invalid post-mortem pull() made by: ${this.sink}`),
        Buffer.alloc(0),
        0
      )
      return
    }

    // pull after end
    if (this[kHadEnd]) {
      throw new Error('[verify] pull was called after stream ended')
    }

    try {
      // error
      if (error !== null && !(error instanceof Error)) {
        throw new TypeError(`[verify] error passed to pull() was non-null and not an Error: ${error}`)
      }
      // buffer
      if (buffer !== undefined && !Buffer.isBuffer(buffer)) {
        throw new TypeError(`[verify] buffer passed to pull() was not a Buffer: ${buffer}`)
      }
    } catch (err) {
      this[kHadError] = true
      // console.error('Verify.pull kHadError')
      this.source.pull(err, Buffer.alloc(0))
      return
    }

    if (error !== null) {
      this[kHadError] = true
    }

    this.source.pull(error, buffer)
  }
}

function checkBind (self) {
  if (!self.source) {
    throw new Error('[verify] source not yet bound')
  }

  if (!self.sink) {
    throw new Error('[verify] sink not yet bound')
  }
}

module.exports = Verify
