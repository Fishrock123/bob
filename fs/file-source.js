'use strict'

// Flags: --expose-internals

const errors = require('internal/errors');
const internalFS = require('internal/fs');
const internalURL = require('internal/url');
const assertEncoding = internalFS.assertEncoding;
const getPathFromURL = internalURL.getPathFromURL;
const fs = require('fs')

const kMinPoolSpace = 128;

module.exports = FileSource

var pool;

function allocNewPool(poolSize) {
  pool = Buffer.allocUnsafe(poolSize);
  pool.used = 0;
}

// util.inherits(FileSource, Readable);
// fs.FileSource = FileSource;

function FileSource(path, options) {
  if (!(this instanceof FileSource))
    return new FileSource(path, options);

  // a little bit bigger buffer and water marks by default
  options = copyObject(getOptions(options, {}));
  if (options.highWaterMark === undefined)
    options.highWaterMark = 64 * 1024;

  // Readable.call(this, options);

  handleError((this.path = getPathFromURL(path)));
  this.fd = options.fd === undefined ? null : options.fd;
  this.flags = options.flags === undefined ? 'r' : options.flags;
  this.mode = options.mode === undefined ? 0o666 : options.mode;

  this.start = options.start;
  this.end = options.end;
  // this.autoClose = options.autoClose === undefined ? true : options.autoClose;
  this.pos = 0;
  this.bytesRead = 0;

  if (this.start !== undefined) {
    if (typeof this.start !== 'number') {
      throw new errors.TypeError('ERR_INVALID_ARG_TYPE',
                                 'start',
                                 'number',
                                 this.start);
    }
    if (this.end === undefined) {
      this.end = Infinity;
    } else if (typeof this.end !== 'number') {
      throw new errors.TypeError('ERR_INVALID_ARG_TYPE',
                                 'end',
                                 'number',
                                 this.end);
    }

    if (this.start > this.end) {
      const errVal = `{start: ${this.start}, end: ${this.end}}`;
      throw new errors.RangeError('ERR_VALUE_OUT_OF_RANGE',
                                  'start',
                                  '<= "end"',
                                  errVal);
    }

    this.pos = this.start !== undefined ? this.start : 0;
  }

  // if (typeof this.fd !== 'number')
  //   this.open();

  // this.on('end', function() {
  //   if (this.autoClose) {
  //     this.destroy();
  //   }
  // });
}

FileSource.prototype.bindSink = function bindSink (sink) {
  this.sink = sink
}

FileSource.prototype.pull = function(error, buffer) {
  console.log((new Error('FileSource pull')).stack)
  if (error) {
    if (typeof this.fd === 'number') {
      console.log('PULL ERROR CLOSE')
      fs.close(this.fd, (closeError) => {
        this.fd = null
        if (closeError) {
          this.sink.next('error', closeError)
        } else {
          this.sink.next('error', error)
        }
      })
    } else {
      return this.sink.next('error', error)
    }
  }

  if (typeof this.fd !== 'number') {
    fs.open(this.path, this.flags, this.mode, (error, fd) => {
      if (error) {
        return this.sink.next('error', error)
      }

      this.fd = fd

      this._read(buffer)
    })
  } else {
    this._read(buffer)
  }
}

FileSource.prototype._read = function(buffer) {
  if (typeof this.fd !== 'number') {
    return this.pull(null, buffer)
  }

  if (this.destroyed)
    return;

  if (buffer.length === 0) {
    console.log((new Error('Buffer length was 0??')).stack)
  }

  fs.read(this.fd, buffer, 0, buffer.length, this.pos, (error, bytesRead) => {
    console.log('read', buffer.length, this.pos, bytesRead)
    if (error) {
      console.log('FS READ ERROR CLOSE')
      fs.close(this.fd, (closeError) => {
        this.fd = null
        if (closeError) {
          this.sink.next('error', closeError)
        } else {
          this.sink.next('error', error)
        }
      })
    } else {
      if (bytesRead > 0) {
        console.log('pos & bytes', this.pos, bytesRead)
        this.pos += bytesRead;
        console.log('this.pos', this.pos)
        this.sink.next('continue', null, buffer, bytesRead)
      } else {
        console.log('END CLOSE')
        fs.close(this.fd, (closeError) => {
          this.fd = null
          if (closeError) {
            this.sink.next('error', closeError)
          } else {
            this.sink.next('end', null, buffer, -1)
          }
        })
      }
    }
  })
}

// FileSource.prototype._destroy = function(err, cb) {
//   if (this.closed || typeof this.fd !== 'number') {
//     if (typeof this.fd !== 'number') {
//       this.once('open', closeFsStream.bind(null, this, cb, err));
//       return;
//     }
//
//     return process.nextTick(() => {
//       cb(err);
//       this.emit('close');
//     });
//   }
//
//   this.closed = true;
//
//   closeFsStream(this, cb);
//   this.fd = null;
// };
//
// FileSource.prototype.close = function(cb) {
//   this.destroy(null, cb);
// };

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
