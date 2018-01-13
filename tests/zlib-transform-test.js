'use strict'

const zlib = require('zlib')

const FileSource = require('../fs/file-source')
const FileSink = require('../fs/file-sink')
const ZlibTransform = require('../zlib/zlib-transform')

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
