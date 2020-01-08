'use strict'

const { Buffer } = require('buffer')
const Status = require('bob-status')

const BufferSource = require('../../helpers/buffer-source')

class AssertionSource extends BufferSource {
  constructor (bufs, expectedErrorType = null) {
    if (!Array.isArray(bufs) || Buffer.isBuffer(bufs)) {
      throw new TypeError('AssertionSource requires a plain array.')
    }

    super(bufs)

    this._pull_count = 0
    this._expected_pulls = bufs.map(buf =>
      Buffer.isBuffer(buf) ? buf.length : Buffer.byteLength(buf)
    )

    this._expected_error_type = expectedErrorType
  }

  bindSink (sink) {
    super.bindSink(sink)
  }

  pull (error, buffer) {
    this._pull_count++

    // if (error || buffer.length === 0) {
    //   console.error('AssertionSource.pull', error, buffer.length)
    // }

    if (error) {
      if (!(error instanceof this._expected_error_type)) {
        error = new Error(
          `AssertionSource: received unexpected error type.\n ` +
          `Pull: ${this._pull_count}, Error: ${error.name} Expected: ${this._expected_error_type.name}`
        )
      }
      return this.sink.next(Status.error, error, Buffer.alloc(0), 0)
    }

    if (this._pull_count > this._expected_pulls.length) {
      error = new Error(
        `AssertionSource: received more pulls than expected.\n ` +
        `Pull: ${this._pull_count}, Expected: ${this._expected_pulls.length}`
      )
      return this.sink.next(Status.error, error, Buffer.alloc(0), 0)
    }

    const bytesRemaining = this._buffer.length - this._offset
    const bytes = buffer.length < bytesRemaining ? buffer.length : bytesRemaining

    // console.log(`AssertionSource: offset, bytes, buf.len - ${this._offset}, ${bytes}, ${this._buffer.length}`)
    // console.log(`AssertionSource: pulls ${this._pull_count}, ${this._expected_pulls.length}`)

    if (this._offset + bytes >= this._buffer.length &&
        this._pull_count < this._expected_pulls.length) {
      error = new Error(
        `AssertionSource: received less pulls than expected.\n ` +
        `Pull: ${this._pull_count}, Expected: ${this._expected_pulls.length}`
      )
      return this.sink.next(Status.error, error, Buffer.alloc(0), 0)
    }

    super.pull(error, buffer)
  }
}

module.exports = AssertionSource
