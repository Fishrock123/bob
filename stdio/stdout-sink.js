'use strict'

const { Buffer } = require('buffer')

module.exports = function sink (bindCb) {
  // bind((err, ?) => {})

  return function (read) {

    let buffer

    _read()

    function next (status, error, bytes) {
      if (status === 'end') return
      if (error) bindCb(error)

      process.stdout.write(buffer.slice(0, bytes))

      _read()
    }

    function _read () {
      try {
        buffer = Buffer.allocUnsafe(64 * 1024)
      } catch (error) {
        return bindCb(error)
      }
      read(null, buffer, next)
    }
  }
}
