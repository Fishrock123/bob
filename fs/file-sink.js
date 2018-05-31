'use strict'

// Flags: --expose-internals

const errors = require('internal/errors');
const internalURL = require('internal/url');
const  { assertEncoding } = require('internal/fs/utils')
const getPathFromURL = internalURL.getPathFromURL;
const fs = require('fs')
const status_type = require('../status-enum')

const kMinPoolSpace = 128;

module.exports = FileSink

function FileSink(path, options) {
  if (!(this instanceof FileSink))
    return new FileSink(path, options);

  options = copyObject(getOptions(options, {}));

  handleError((this.path = getPathFromURL(path)));
  this.fd = options.fd === undefined ? null : options.fd;
  this.flags = options.flags === undefined ? 'w' : options.flags;
  this.mode = options.mode === undefined ? 0o666 : options.mode;

  this.start = options.start;
  this.autoClose = options.autoClose === undefined ? true : !!options.autoClose;
  this.pos = undefined;
  this.bytesWritten = 0;
  this.buffer = null

  if (this.start !== undefined) {
    if (typeof this.start !== 'number') {
      throw new errors.TypeError('ERR_INVALID_ARG_TYPE',
                                 'start',
                                 'number',
                                 this.start);
    }
    if (this.start < 0) {
      const errVal = `{start: ${this.start}}`;
      throw new errors.RangeError('ERR_VALUE_OUT_OF_RANGE',
                                  'start',
                                  '>= 0',
                                  errVal);
    }

    this.pos = this.start;
  } else {
    this.pos = 0;
  }

  if (options.encoding)
    this.encoding = checkEncoding(options.encoding);
  else
    this.encoding = 'utf8'

  // if (typeof this.fd !== 'number')
  //   this.open();
  //
  // // dispose on finish.
  // this.once('finish', function() {
  //   if (this.autoClose) {
  //     this.destroy();
  //   }
  // });
};

FileSink.prototype.bindSource = function bindSource (source, bindCb) {
  if (typeof bindCb !== 'function') {
    throw new errors.TypeError('ERR_INVALID_CALLBACK')
  }

  source.bindSink(this)

  this.source = source
  this.bindCb = bindCb

  this.sink()
}


FileSink.prototype.sink = function () {
  if (typeof this.fd !== 'number') {
    fs.open(this.path, this.flags, this.mode, (error, fd) => {
      if (error) {
        this.source.pull(error, Buffer.alloc(0))
      }

      this.fd = fd

      this._read()
    })
  } else {
    this._read()
  }
}

FileSink.prototype._read = function _read () {
  if (Buffer.isBuffer(this.buffer))
    return this.source.pull(null, this.buffer)

  try {
    this.buffer = Buffer.allocUnsafe(64 * 1024)
  } catch (error) {
    return this.bindCb(error)
  }
  this.source.pull(null, this.buffer)
}

FileSink.prototype.next = function next (status, error, _buf, bytes) {
  if (status === undefined) {
    this.source.pull(new Error('undefined status'), Buffer.alloc(0))
    return
  }

  if (status === status_type.end) {
    return fs.close(this.fd, (closeError) => {
      if (closeError) {
        this.source.pull(closeError, Buffer.alloc(0))
      }
      this.bindCb()
    })
  }
  if (error) {
    return fs.close(this.fd, (closeError) => {
      if (closeError) {
        this.source.pull(closeError, Buffer.alloc(0))
      }
      this.bindCb(error)
    })
  }

  if (typeof this.fd !== 'number') {
    return this.bindCb(new Error('FD is not a number'))
  }

  const buf = Buffer.isBuffer(_buf) ? _buf : bytes === this.buffer.length ? this.buffer : this.buffer.slice(0, bytes)

  fs.write(this.fd, buf, 0, bytes, this.pos, (er, bytesWritten) => {
    if (error) {
      this.source.pull(error, Buffer.alloc(0))
    } else {
      if (bytesWritten > 0) {
        this.pos += bytesWritten;
      }
      // else ...? What happens if nothing is written?

      this._read()
    }
  });
};

/* ## Helpers ## */

// function closeFsStream(stream, cb, err) {
//   fs.close(stream.fd, (er) => {
//     er = er || err;
//     cb(er);
//     if (!er)
//       stream.emit('close');
//   });
// }

function handleError(val, callback) {
  if (val instanceof Error) {
    if (typeof callback === 'function') {
      process.nextTick(callback, val);
      return true;
    } else throw val;
  }
  return false;
}

function getOptions(options, defaultOptions) {
  if (options === null || options === undefined ||
      typeof options === 'function') {
    return defaultOptions;
  }

  if (typeof options === 'string') {
    defaultOptions = util._extend({}, defaultOptions);
    defaultOptions.encoding = options;
    options = defaultOptions;
  } else if (typeof options !== 'object') {
    throw new errors.TypeError('ERR_INVALID_ARG_TYPE',
                               'options',
                               ['string', 'object'],
                               options);
  }

  if (options.encoding !== 'buffer')
    assertEncoding(options.encoding);
  return options;
}

function copyObject(source) {
  var target = {};
  for (var key in source)
    target[key] = source[key];
  return target;
}

function checkEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string')
    encoding = encoding.toLowerCase();
  if (!Buffer.isEncoding(encoding))
    throw new errors.TypeError('ERR_UNKNOWN_ENCODING', encoding);

  return encoding
}
