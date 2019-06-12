'use strict'

const tap = require('tap')
const zlib = require('zlib')

const Stream = require('../helpers/stream')
const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const ReadableSink = require('../helpers/readable-sink')
const WritableSource = require('../helpers/writable-source')
const Verify = require('../reference-verify')

tap.test('test streams3 (BobDuplex) with a Transform', t => {
  t.plan(1)

  const source = new AssertionSource([
    'Hello World\n'
  ])
  const sink = new AssertionSink([
    Buffer.from([
      0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x13
    ]),
    Buffer.from([
      0xf3, 0x48, 0xcd, 0xc9, 0xc9, 0x57, 0x08, 0xcf, 0x2f, 0xca,
      0x49, 0xe1, 0x02, 0x00, 0xe3, 0xe5, 0x95, 0xb0, 0x0c, 0x00,
      0x00, 0x00
    ]),
    Buffer.alloc(0)
  ])

  const rsink = new ReadableSink({ highWaterMark: 1024, name: 'rsink' })
  const wsource = new WritableSource({ highWaterMark: 1024, name: 'wsource' })

  const rstream = new Stream(source, new Verify(), rsink) // eslint-disable-line no-unused-vars
  const wstream = new Stream(wsource, new Verify(), sink)

  const gzip = zlib.createGzip()
  gzip.on('error', error => t.fail('GZIP error', error))

  rsink.pipe(gzip).pipe(wsource)

  wstream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
