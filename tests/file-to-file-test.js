'use strict'

// node --expose-internals file-to-file-test.js ./fixtures/test

const FileSource = require('fs-source')
const FileSink = require('fs-sink')
const PassThrough = require('../reference-passthrough')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '_')
const passThrough = new PassThrough()

fileSink.bindSource(passThrough.bindSource(fileSource), error => {
  if (error)
    console.error('ERROR!', error)
  else {
    console.log('done')
  }
})
