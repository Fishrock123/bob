'use strict'

const tap = require('tap')

const status_type = require('../reference-status-enum') // eslint-disable-line camelcase
const AssertionSource = require('./helpers/assertion-source')
const AssertionSink = require('./helpers/assertion-sink')
const Verify = require('../reference-verify')
const Stream = require('../helpers/stream')
const Asyncify = require('../helpers/asyncify')

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

class DoublePullSink {
  bindSource (source) {
    this.source = source
    this.source.bindSink(this)
    return this
  }

  start (exitCb) {
    this.exitCb = exitCb
    this.source.pull(null, Buffer.alloc(10))
    this.source.pull(null, Buffer.alloc(10))
  }

  next (status, error) {
    if (status === status_type.error) {
      this.exitCb(error)
    } else if (status === status_type.continue) {
      this.source.pull(null, Buffer.alloc(10))
    } else {
      this.exitCb(null)
    }
  }
}

tap.test('test reference verify sink double-pull', t => {
  t.plan(2)

  const source = new AssertionSource([
    Buffer.alloc(10),
    Buffer.alloc(10),
    Buffer.alloc(10)
  ], Error)
  const sink = new DoublePullSink()

  const stream = new Stream(source, new Asyncify(), new Verify(), sink)
  stream.start(error => {
    t.type(error, Error)
    t.equal(error.message, '[verify] a pull() was already in progress, came from: [object Object]')
    t.end()
  })
})

tap.test('test reference verify sink double-pull sync', t => {
  t.plan(2)

  const source = new AssertionSource([
    Buffer.alloc(10),
    Buffer.alloc(10),
    Buffer.alloc(10)
  ])
  const sink = new DoublePullSink()

  const stream = new Stream(source, new Verify(), sink)
  t.throws(_ => {
    stream.start(error => {
      t.type(error, null)
      process.nextTick(_ => t.end())
    })
  }, { message: '[verify] pull was called after stream ended' })
})
