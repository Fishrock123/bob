'use strict'

// node --expose-internals file-to-file-test-c++-source.js ./fixtures/test

const BindFileSource = require('../addons/fs-source/build/Release/addon')
const FileSink = require('fs-sink')
const PassThrough = require('../addons/passthrough/build/Release/addon')

const fileSink = new FileSink(process.argv[2] + '_')
const passThrough = new PassThrough()

// weird but node core is weird, too
BindFileSource(passThrough, process.argv[2])

fileSink.bindSource(passThrough, error => {
  if (error)
    console.error('ERROR!', error)
  else {
    console.log('done')
  }
})
