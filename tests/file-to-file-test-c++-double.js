'use strict'

// node --expose-internals file-to-file-test-c++-double.js ./fixtures/test

const FileSource = require('fs-source')
const FileSink = require('fs-sink')
const PassThrough = require('../addons/passthrough/build/Release/addon')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '_')
const passThrough1 = new PassThrough()
const passThrough2 = new PassThrough()

fileSink.bindSource(passThrough1.bindSource(passThrough2.bindSource(fileSource)), error => {
  if (error)
    console.error('ERROR!', error)
  else {
    console.log('done')
  }
})
