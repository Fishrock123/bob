'use strict'

// node --expose-internals zlib-transform-test.js ./fixtures/test

const zlib = require('zlib')
const util = require('util')

const Stream = require('../helpers/stream')
const FileSource = require('fs-source')
const FileSink = require('fs-sink')
const ZlibTransform = require('zlib-transform')
const PassThrough = require('../reference-passthrough')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '.gz')
const zlibTransform = new ZlibTransform({}, zlib.constants.GZIP)
const passThrough = new PassThrough()

;(async function main () {
  const streamSource = new Stream(fileSource, zlibTransform)
  const streamSink = new Stream(passThrough, fileSink)
  const stream = new Stream(streamSource, new PassThrough(), streamSink)

  await util.promisify(stream.start.bind(stream))()

  console.log('done (resolved)')
})().catch(err => {
  console.error('ERROR! (rejected)', err)
})
