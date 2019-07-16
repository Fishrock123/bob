'use strict'

const tap = require('tap')
const zlib = require('zlib')

const Stream = require('../helpers/stream')
const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const BobDuplex = require('../helpers/bob-duplex')
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

  const bobDuplex1 = new BobDuplex({ highWaterMark: 1024, name: '1' })
  const bobDuplex2 = new BobDuplex({ highWaterMark: 1024, name: '2' })

  const stream1 = new Stream(source, new Verify(), bobDuplex1) // eslint-disable-line no-unused-vars
  const stream2 = new Stream(bobDuplex2, new Verify(), sink)

  const gzip = zlib.createGzip()
  gzip.on('error', error => t.fail('GZIP error', error))

  bobDuplex1.pipe(gzip).pipe(bobDuplex2)

  stream2.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
