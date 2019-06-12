'use strict'

// node bob-streams3-zlib.js ./fixtures/test

const Stream = require('../helpers/stream')
const BobDuplex = require('../helpers/bob-duplex')
const FileSource = require('fs-source')

const fs = require('fs')

const ws = fs.createWriteStream(process.argv[2] + '_', { highWaterMark: 1024 })

const fileSource = new FileSource(process.argv[2])
const bobDuplex = new BobDuplex({ highWaterMark: 1024, name: '1' })

new Stream(fileSource, bobDuplex)

console.log('pipe source to fs write stream')
bobDuplex.pipe(ws)

bobDuplex.on('error', err => console.error('BOB Duplex ERROR!', err))
ws.on('error', err => console.error('WS ERROR!', err))

ws.on('finish', _ => console.log('done'))
