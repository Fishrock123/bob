'use strict'

// node --expose-internals zlib-transform-test.js ./fixtures/test

const zlib = require('zlib')

const Stream = require('../helpers/stream')
const FileSource = require('fs-source')
const FileSink = require('fs-sink')
const ZlibTransform = require('zlib-transform')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '.gz')
const zlibTransform = new ZlibTransform({}, zlib.constants.GZIP)

const stream = new Stream(fileSource, zlibTransform, fileSink)
try {
  stream.start()
} catch (e) {}

stream.then(resolved => {
  console.log('done (resolved)')
}, rejected => {
  console.error('ERROR! (rejected)', rejected)
  console.error((new Error()).stack)
})
