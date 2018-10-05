'use strict'

// node --expose-internals zlib-transform-test.js ./fixtures/test

const zlib = require('zlib')

const FileSource = require('fs-source')
const FileSink = require('fs-sink')
const ZlibTransform = require('zlib-transform')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '.gz')
const zlibTransform = new ZlibTransform({}, zlib.constants.GZIP)

fileSink.bindSource(zlibTransform.bindSource(fileSource), error => {
  if (error) {
    console.error('ERROR!', error)
    console.error((new Error()).stack)
  } else {
    console.log('done')
  }
})
