'use strict'

// node bob-streams3-files.js ./fixtures/test

const Stream = require('../helpers/stream')
const BobDuplex = require('../helpers/bob-duplex')
const FileSource = require('fs-source')
const FileSink = require('fs-sink')

const fileSource = new FileSource(process.argv[2])
const fileSink = new FileSink(process.argv[2] + '_')
const bobDuplex1 = new BobDuplex({ highWaterMark: 1024, name: '1' })
const bobDuplex2 = new BobDuplex({ highWaterMark: 1024, name: '2' })

const stream1 = new Stream(fileSource, bobDuplex1)
const stream2 = new Stream(bobDuplex2, fileSink)

console.log('pipe source to sink')
bobDuplex1.pipe(bobDuplex2)

stream2.start(err => {
  if (err) {
    return console.error('ERROR!', err)
  }
  console.log('done')
})
