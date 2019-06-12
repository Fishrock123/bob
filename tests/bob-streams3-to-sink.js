'use strict'

// node bob-streams3-zlib.js ./fixtures/test

const Stream = require('../helpers/stream')
const BobDuplex = require('../helpers/bob-duplex')
const FileSink = require('fs-sink')

const fs = require('fs')

const rs = fs.createReadStream(process.argv[2], { highWaterMark: 1024 })

const fileSink = new FileSink(process.argv[2] + '_')
const bobDuplex = new BobDuplex({ highWaterMark: 1024, name: '1' })

const stream = new Stream(bobDuplex, fileSink)

rs.pipe(bobDuplex)

bobDuplex.on('error', err => console.error('BOB Duplex ERROR!', err))
rs.on('error', err => console.error('RS ERROR!', err))

stream.start(err => {
  if (err) {
    return console.error('EROR!', err)
  }
  console.log('done')
})
