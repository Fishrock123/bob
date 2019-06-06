'use strict'

// node --expose-internals file-to-file-test.js ./fixtures/test

const Stream = require('../helpers/stream')
const FileSource = require('fs-source')
const FileSink = require('fs-sink')
const PassThrough = require('../reference-passthrough')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '_')
const passThrough = new PassThrough()

const stream = new Stream(fileSource, passThrough, fileSink)
try {
  stream.start()
} catch (e) {}

stream.then(resolved => {
  console.log('done (resolved)')
}, rejected => {
  console.error('ERROR! (rejected)', rejected)
})
