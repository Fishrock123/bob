'use strict'

const tap = require('tap')
const fs = require('fs')
const path = require('path')

const AssertionSource = require('./helpers/assertion-source')
const FileSink = require('fs-sink')
const Verify = require('../reference-verify')
const Stream = require('../helpers/stream')

tap.test('test file write', t => {
  t.plan(3)
  const filename = path.join(__dirname, '.tmp', 'test-write-file.txt')

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

  const stream = new Stream(source, new Verify(), fileSink)
  stream.start(error => {
    t.error(error, 'Exit Callback received unexpected error')

    fs.readFile(filename, { encoding: 'utf8' }, (err, file) => {
      t.error(err, 'ReadFile issue')
      t.equal(file, expects.join(''), 'written output correctness', expects)
      t.end()
    })
  })
})
