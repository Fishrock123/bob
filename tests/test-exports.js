'use strict'

const tap = require('tap')

tap.test('test file read', t => {
  t.plan(1)

  t.deepEqual(Object.keys(require('../')), [
    'status_type',
    'Passthrough',
    'BufferSource',
    'StdoutSink',
    'Stream',
    'AssertionSink',
    'AssertionSource'
  ], 'Exports are as expected')

  t.end()
})
