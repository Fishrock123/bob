'use strict'

const fs = require('fs')
const zlib = require('zlib')

const rs = fs.createReadStream(process.argv[2], { highWaterMark: 64 * 1024 })
const ws = fs.createWriteStream(process.argv[2] + '.gz', { highWaterMark: 64 * 1024 })
const ts = zlib.createGzip()

rs.on('error', error => console.error('RS ERROR!', error))
ts.on('error', error => console.error('PS ERROR!', error))
ws.on('error', error => console.error('WS ERROR!', error))
rs.pipe(ts).pipe(ws)
