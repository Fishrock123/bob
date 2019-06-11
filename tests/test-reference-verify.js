'use strict'

const tap = require('tap')

const status_type = require('../reference-status-enum') // eslint-disable-line camelcase
const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const Verify = require('../reference-verify')
const Stream = require('../helpers/stream')

tap.test('test reference verify source TypeError', t => {
  t.plan(1)

  class Source {
    bindSink (sink) {
      this.sink = sink
    }

    pull () {
      this.sink.next(status_type.continue, 'maybe error', 3, Buffer)
    }
  }

  const source = new Source()
  const sink = new AssertionSink([
    Buffer.alloc(10)
  ])

  const stream = new Stream(source, new Verify(), sink)
  stream.start(error => {
    t.equal(error, 'maybe error', 'Exit Callback received expected error')
    t.end()
  })
})

tap.test('test reference verify sink double-pull', t => {
  t.plan(2)

  class Sink {
    bindSource (source) {
      this.source = source
      this.source.bindSink(this)
      return this
    }

    start (exitCb) {
      this.exitCb = exitCb
      this.source.pull(null, Buffer.alloc(0))
      this.source.pull(null, Buffer.alloc(0))
    }

    next (status, error) {
      if (status === status_type.error) {
        this.exitCb(error)
      } else {
        this.source.pull(null, Buffer.alloc(0))
      }
    }
  }

  const source = new AssertionSource([
    Buffer.alloc(10)
  ])
  const sink = new Sink()

  const stream = new Stream(source, new Verify(), sink)
  stream.start(error => {
    t.type(error, Error)
    t.equal(error.message, '[verify] a pull() was already in progress, came from: [object Object]')
    t.end()
  })
})
