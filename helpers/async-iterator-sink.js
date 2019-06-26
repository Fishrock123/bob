'use strict'

const asyncIterator = Symbol.asyncIterator || Symbol('asyncIterator')

const { Buffer } = require('buffer')
const status_type = require('bob-status')

class AsyncIterSink {
  constructor () {
    this.source = null
    this.exitCb = null

    try {
      this._buffer = Buffer.allocUnsafe(64 * 1024)
    } catch (error) {
      this._allocError = error
    }
  }

  bindSource (source) {
    this.source = source
    this.source.bindSink(this)
    return this
  }

  start (exitCb) {
    if (this._allocError) {
      return exitCb(this._allocError)
    }
    this.exitCb = exitCb

    this.source.pull(null, this._buffer)
  }

  next (status, error, buffer, bytes) {
    if (error || status === status_type.end) {
      return this.exitCb(error)
    }

    process.stdout.write(buffer.slice(0, bytes))

    this.source.pull(null, this._buffer)
  }

  [asyncIterator] () {
    const stream = this

    let error = null
    let ended = false
    let promiseResolve
    let promiseReject

    this.on('error', (err) => { error = err })
    this.on('end', () => { ended = true })
    this.on('close', () => call(error, null))
    this.on('readable', () => call(null, stream.read()))

    return {
      next () {
        return new Promise(function (resolve, reject) {
          promiseResolve = resolve
          promiseReject = reject
          const data = stream.read()
          if (data !== null) call(null, data)
        })
      }
    }

    function call (err, data) {
      if (promiseReject === null) return
      if (err) promiseReject(err)
      else if (data === null && !ended) promiseReject(STREAM_DESTROYED)
      else promiseResolve({ value: data, done: data === null })
      promiseReject = promiseResolve = null
    }
  }
}

module.exports = AsyncIterSink
