'use strict'

const FileSource = require('fs-source')
const FileSink = require('fs-sink')
const PassThrough = require('../addons/passthrough/build/Release/addon')
const Stream = require('../helpers/stream')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '_')
const passThrough1 = new PassThrough()
const passThrough2 = new PassThrough()

const stream = new Stream(fileSource, passThrough1, passThrough2, fileSink)
stream.start(error => {
  if (error) {
    console.error('ERROR!', error)
  } else {
    console.log('done')
  }
})
