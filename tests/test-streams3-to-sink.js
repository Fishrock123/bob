'use strict'

const tap = require('tap')
const fs = require('fs')
const path = require('path')

const AssertionSink = require('./helpers/assertion-sink')
const BobDuplex = require('../helpers/bob-duplex')

tap.test('test streams3 (BobDuplex) to a sink', t => {
  t.plan(1)

  const filename = path.join(__dirname, 'fixtures', 'test-simple')

  const sink = new AssertionSink([
    'Hello World\n',
    ''
  ], 'utf8')

  const rs = fs.createReadStream(filename, { highWaterMark: 1024 })
  const bobDuplex = new BobDuplex({ highWaterMark: 1024, name: '1' })

  rs.pipe(bobDuplex)
  rs.on('error', error => t.fail('ReadStream error', error))

  sink.bindSource(bobDuplex).start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
