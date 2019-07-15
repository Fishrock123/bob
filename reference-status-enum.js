'use strict'

// Canonical version at https://www.npmjs.com/package/bob-status

module.exports = {
  error: -1,
  end: 0,
  continue: 1,

  // Lookup map
  '-1': 'error',
  '0': 'end', // eslint-disable-line quote-props
  '1': 'continue' // eslint-disable-line quote-props
}
