'use strict'

const tap = require('tap')
const fs = require('fs')
const path = require('path')

const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const FileSource = require('fs-source')
const FileSink = require('fs-sink')

tap.test('test file write + read', t => {
  t.plan(2)
  const filename = path.join(__dirname, '.tmp', 'test-write-read-file.txt')

  try {
    fs.unlinkSync(filename)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }

  const expects = [
    'Hello World\n'
  ]

  const source = new AssertionSource(expects)
  const fileSink = new FileSink(filename)

  fileSink.bindSource(source).start(error => {
    t.error(error, 'Exit Callback received unexpected error')

    const fileSource = new FileSource(filename)
    const sink = new AssertionSink([
      'Hello',
      ' ',
      'World',
      '\n',
      ''
    ], 'utf8')

    sink.bindSource(fileSource).start(error => {
      t.error(error, 'Exit Callback received unexpected error')
      t.end()
    })
  })
})
