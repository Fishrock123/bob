'use strict'

const tap = require('tap')
const path = require('path')

const FileSource = require('fs-source')
const AssertionSink = require('./helpers/assertion-sink')
const Verify = require('../reference-verify')
const Stream = require('../helpers/stream')

tap.test('test file read', t => {
  t.plan(1)
  const fileSource = new FileSource(path.join(__dirname, 'fixtures', 'test-simple'))
  const sink = new AssertionSink([
    'Hello',
    ' ',
    'World',
    '\n',
    ''
  ], 'utf8')

  const stream = new Stream(fileSource, new Verify(), sink)
  stream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')
    t.end()
  })
})
