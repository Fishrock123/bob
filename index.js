'use strict'

module.exports = {
  Status: require('./reference-status-enum'),
  // eslint-disable-next-line camelcase
  status_type: require('./reference-status-enum'), // Backwards-compat
  Asyncify: require('./helpers/asyncify'),
  Passthrough: require('./reference-passthrough'),
  BufferSource: require('./helpers/buffer-source'),
  StdoutSink: require('./helpers/stdout-sink'),
  Stream: require('./helpers/stream'),
  AssertionSink: require('./tests/helpers/assertion-sink'),
  AssertionSource: require('./tests/helpers/assertion-source'),
  Verify: require('./reference-verify')
}
