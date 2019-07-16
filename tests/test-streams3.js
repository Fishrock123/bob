'use strict'

const tap = require('tap')

const Stream = require('../helpers/stream')
const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const BobDuplex = require('../helpers/bob-duplex')
const Verify = require('../reference-verify')

tap.test('test streams3 adaptor (BobDuplex)', t => {
  t.plan(1)

  const source = new AssertionSource([
    'Hello ',
    'World\n'
  ])
  const sink = new AssertionSink([
    'Hello ',
    'World\n',
    ''
  ], 'utf8')

  const bobDuplex1 = new BobDuplex({ highWaterMark: 6, name: '1' })
  const bobDuplex2 = new BobDuplex({ highWaterMark: 6, name: '2' })

  const stream1 = new Stream(source, new Verify(), bobDuplex1) // eslint-disable-line no-unused-vars
  const stream2 = new Stream(bobDuplex2, new Verify(), sink)

  bobDuplex1.pipe(bobDuplex2)

  stream2.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
