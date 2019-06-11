'use strict'

const tap = require('tap')
const zlib = require('zlib')
const util = require('util')

const Stream = require('../helpers/stream')
const Verify = require('../reference-verify')
const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const ZlibTransform = require('zlib-transform')
const PassThrough = require('../reference-passthrough')

tap.test('test Stream() with promisify', async t => {
  const expects = [
    'Hello Wo',
    'rld\n'
  ]

  const source = new AssertionSource(expects)
  const sink = new AssertionSink(expects)
  const stream = new Stream(source, new Verify(), sink)

  await util.promisify(stream.start.bind(stream))()
})

tap.test('test Stream() consuming other Stream()s', async t => {
  const source = new AssertionSource([
    'Hello World\n',
    ''
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
  const zlibTransform = new ZlibTransform({}, zlib.constants.GZIP)

  const streamSource = new Stream(source, zlibTransform)
  const streamSink = new Stream(new PassThrough(), sink)
  const stream = new Stream(streamSource, new Verify(), streamSink)

  await util.promisify(stream.start.bind(stream))()
})
