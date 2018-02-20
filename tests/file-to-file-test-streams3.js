'use strict'

const fs = require('fs')
const stream = require('stream')

const rs = fs.createReadStream(process.argv[2], { highWaterMark: 64 * 1024 })
const ws = fs.createWriteStream(process.argv[2] + '_', { highWaterMark: 64 * 1024 })
const ps = new stream.PassThrough()

rs.on('error', error => console.error('RS ERROR!', error))
ps.on('error', error => console.error('PS ERROR!', error))
ws.on('error', error => console.error('WS ERROR!', error))
rs.pipe(ps).pipe(ws)
