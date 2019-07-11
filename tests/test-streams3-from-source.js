'use strict'

const tap = require('tap')
const fs = require('fs')
const path = require('path')

const AssertionSource = require('./helpers/assertion-source')
const BobDuplex = require('../helpers/bob-duplex')

tap.test('test streams3 (BobDuplex) from a source', t => {
  t.plan(2)
  const filename = path.join(__dirname, '.tmp', 'test-streams3-file.txt')

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

  const ws = fs.createWriteStream(filename, { highWaterMark: 1024 })
  const bobDuplex = new BobDuplex({ highWaterMark: 1024, name: '1' })

  bobDuplex.bindSource(source)
  bobDuplex.pipe(ws)

  ws.on('error', error => t.fail('WriteStream error', error))

  ws.on('finish', _ => {
    fs.readFile(filename, { encoding: 'utf8' }, (err, file) => {
      t.error(err, 'ReadFile issue')
      t.equal(file, expects.join(''), 'written output correctness', expects)
      t.end()
    })
  })
})
