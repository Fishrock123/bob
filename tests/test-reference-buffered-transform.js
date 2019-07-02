'use strict'

const tap = require('tap')

const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const BufferedTransform = require('../reference-buffered-transform')
const Stream = require('../helpers/stream')

tap.test('test reference buffered transform', t => {
  t.plan(1)
  const expects = [
    'Hello ',
    'World\n'
  ]

  const source = new AssertionSource(expects)
  const sink = new AssertionSink([
    'Hello ',
    'World\n',
    ''
  ], 'utf8')

  const transform = new BufferedTransform(8) // Buffer 8 bytes

  const stream = new Stream(source, transform, sink)
  stream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
