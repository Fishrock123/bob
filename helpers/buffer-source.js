'use strict'

const { Buffer } = require('buffer')
const status_type = require('bob-status') // eslint-disable-line camelcase

class BufferSource {
  constructor (buf) {
    this.sink = null

    if (!Buffer.isBuffer(buf)) {
      if (Array.isArray(buf)) {
        const arr = buf
        for (let i = 0; i < arr.length; i++) {
          if (!Buffer.isBuffer(arr[i])) {
            arr[i] = Buffer.from(arr[i])
          }
        }
        this._alloc_size = arr[0].length
        buf = Buffer.concat(arr)
      } else {
        buf = Buffer.from(buf)
        this._alloc_size = buf.length
      }
    } else {
      this._alloc_size = buf.length
    }

    this._offset = 0
    this._buffer = buf
  }

  bindSink (sink) {
    this.sink = sink
  }

  pull (error, buffer) {
    if (error) {
      return this.sink.next(status_type.error, error, Buffer.alloc(0), 0)
    }

    if (this._offset >= this._buffer.length) {
      error = new Error(`BufferSource: pull after end. Offset: ${this._offset}`)
      return this.sink.next(status_type.error, error, Buffer.alloc(0), 0)
    }

    if (!Buffer.isBuffer(buffer)) {
      buffer = Buffer.alloc(this._alloc_size)
    }

    const bytesRemaining = this._buffer.length - this._offset
    const bytes = buffer.length < bytesRemaining ? buffer.length : bytesRemaining

    const bytesWritten = this._buffer.copy(buffer, 0, this._offset, this._offset + bytes)
    this._offset += bytesWritten

    // console.log('BufferSource - Offset: ' + this._offset + ' , buf.length: ' + this._buffer.length)

    if (this._offset < this._buffer.length - 1) {
      this.sink.next(status_type.continue, null, buffer, bytesWritten)
    } else {
      this.sink.next(status_type.end, null, buffer, bytesWritten)
    }
  }
}

module.exports = BufferSource
