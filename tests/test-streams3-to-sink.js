'use strict'

const tap = require('tap')
const fs = require('fs')
const path = require('path')

const Stream = require('../helpers/stream')
const AssertionSink = require('./helpers/assertion-sink')
const WritableSource = require('../helpers/writable-source')
const Verify = require('../reference-verify')

tap.test('test streams3 (BobDuplex) to a sink', t => {
  t.plan(1)

  const filename = path.join(__dirname, 'fixtures', 'test-simple')

  const sink = new AssertionSink([
    'Hello World\n',
    ''
  ], 'utf8')

  const rs = fs.createReadStream(filename, { highWaterMark: 1024 })
  const source = new WritableSource({ highWaterMark: 1024, name: '1' })

  rs.pipe(source)
  rs.on('error', error => t.fail('ReadStream error', error))

  const stream = new Stream(source, new Verify(), sink)
  stream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
