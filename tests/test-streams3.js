'use strict'

const tap = require('tap')

const Stream = require('../helpers/stream')
const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const ReadableSink = require('../helpers/readable-sink')
const WritableSource = require('../helpers/writable-source')
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

  const rsink = new ReadableSink({ highWaterMark: 6, name: 'rsink' })
  const wsource = new WritableSource({ highWaterMark: 6, name: 'wsource' })

  const rstream = new Stream(source, new Verify(), rsink) // eslint-disable-line no-unused-vars
  const wstream = new Stream(wsource, new Verify(), sink)

  rsink.pipe(wsource)

  wstream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
