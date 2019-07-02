'use strict'

const tap = require('tap')
const zlib = require('zlib')

const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const ZlibTransform = require('zlib-transform')
const Stream = require('../helpers/stream')

tap.test('test zlib transform', t => {
  const expects = [
    'Hello World\n',
    ''
  ]

  const source = new AssertionSource(expects)
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

  const zlibTransform = new ZlibTransform({
    hwm: 6 // important
  }, zlib.constants.GZIP)

  const stream = new Stream(source, zlibTransform, sink)
  stream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
