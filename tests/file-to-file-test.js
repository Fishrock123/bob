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
stream.start(err => {
  if (err) {
    return console.error('ERROR!', err)
  }
  console.log('done')
})
