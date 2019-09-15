'use strict'

const FileSource = require('fs-source')
const StdoutSink = require('../../helpers/stdout-sink')

const fileSource = new FileSource(process.argv[2])
const stdoutSink = new StdoutSink()

stdoutSink.bindSource(fileSource).start(error => {
  if (error) {
    console.error('ERROR!', error)
  } else {
    console.log('done')
  }
})
