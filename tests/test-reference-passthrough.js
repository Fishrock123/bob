'use strict'

const tap = require('tap')

const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const Passthrough = require('../reference-passthrough')
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

  const stream = new Stream(source, new Passthrough(), sink)
  stream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
