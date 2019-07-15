'use strict'

module.exports = {
  status_type: require('./reference-status-enum'), // eslint-disable-line camelcase
  Passthrough: require('./reference-passthrough'),
  BufferSource: require('./helpers/buffer-source'),
  StdoutSink: require('./helpers/stdout-sink'),
  Stream: require('./helpers/stream'),
  AssertionSink: require('./tests/helpers/assertion-sink'),
  AssertionSource: require('./tests/helpers/assertion-source')
}
