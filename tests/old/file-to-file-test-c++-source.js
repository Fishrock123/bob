'use strict'

const BindFileSource = require('../../addons/fs-source/build/Release/addon')
const FileSink = require('fs-sink')
const PassThrough = require('../../addons/passthrough/build/Release/addon')

const fileSink = new FileSink(process.argv[2] + '_')
const passThrough = new PassThrough()

// weird but node core is weird, too
BindFileSource(passThrough, process.argv[2])

fileSink.bindSource(passThrough).start(error => {
  if (error) {
    console.error('ERROR!', error)
  } else {
    console.log('done')
  }
})
