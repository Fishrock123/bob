'use strict';

// Flags: --expose-internals

const util = require('util')

const errors = require('internal/errors');
const Transform = require('_stream_transform');
const { _extend } = require('util');
const { isAnyArrayBuffer } = process.binding('util');
const { isArrayBufferView } = require('internal/util/types');
const binding = process.binding('zlib');
const assert = require('assert').ok;
const {
  Buffer,
  kMaxLength
} = require('buffer');

const constants = process.binding('constants').zlib;
const {
  Z_NO_FLUSH, Z_BLOCK, Z_PARTIAL_FLUSH, Z_SYNC_FLUSH, Z_FULL_FLUSH, Z_FINISH,
  Z_MIN_CHUNK, Z_MIN_WINDOWBITS, Z_MAX_WINDOWBITS, Z_MIN_LEVEL, Z_MAX_LEVEL,
  Z_MIN_MEMLEVEL, Z_MAX_MEMLEVEL, Z_DEFAULT_CHUNK, Z_DEFAULT_COMPRESSION,
  Z_DEFAULT_STRATEGY, Z_DEFAULT_WINDOWBITS, Z_DEFAULT_MEMLEVEL, Z_FIXED,
  DEFLATE, DEFLATERAW, INFLATE, INFLATERAW, GZIP, GUNZIP, UNZIP
} = constants;
const { inherits } = require('util');

// translation table for return codes.
const codes = {
  Z_OK: constants.Z_OK,
  Z_STREAM_END: constants.Z_STREAM_END,
  Z_NEED_DICT: constants.Z_NEED_DICT,
  Z_ERRNO: constants.Z_ERRNO,
  Z_STREAM_ERROR: constants.Z_STREAM_ERROR,
  Z_DATA_ERROR: constants.Z_DATA_ERROR,
  Z_MEM_ERROR: constants.Z_MEM_ERROR,
  Z_BUF_ERROR: constants.Z_BUF_ERROR,
  Z_VERSION_ERROR: constants.Z_VERSION_ERROR
};

const ckeys = Object.keys(codes);
for (var ck = 0; ck < ckeys.length; ck++) {
  var ckey = ckeys[ck];
  codes[codes[ckey]] = ckey;
}

// // the Zlib class they all inherit from
// // This thing manages the queue of requests, and returns
// // true or false if there is anything in the queue when
// // you call the .write() method.
// function Zlib(opts, mode) {
//   var chunkSize = Z_DEFAULT_CHUNK;
//   var flush = Z_NO_FLUSH;
//   var finishFlush = Z_FINISH;
//   var windowBits = Z_DEFAULT_WINDOWBITS;
//   var level = Z_DEFAULT_COMPRESSION;
//   var memLevel = Z_DEFAULT_MEMLEVEL;
//   var strategy = Z_DEFAULT_STRATEGY;
//   var dictionary;
//
//   if (typeof mode !== 'number')
//     throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'mode', 'number');
//   if (mode < DEFLATE || mode > UNZIP)
//     throw new errors.RangeError('ERR_OUT_OF_RANGE', 'mode');
//
//   if (opts) {
//     chunkSize = opts.chunkSize;
//     if (chunkSize !== undefined && chunkSize === chunkSize) {
//       if (chunkSize < Z_MIN_CHUNK || !Number.isFinite(chunkSize))
//         throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
//                                     'chunkSize',
//                                     chunkSize);
//     } else {
//       chunkSize = Z_DEFAULT_CHUNK;
//     }
//
//     flush = opts.flush;
//     if (flush !== undefined && flush === flush) {
//       if (flush < Z_NO_FLUSH || flush > Z_BLOCK || !Number.isFinite(flush))
//         throw new errors.RangeError('ERR_INVALID_OPT_VALUE', 'flush', flush);
//     } else {
//       flush = Z_NO_FLUSH;
//     }
//
//     finishFlush = opts.finishFlush;
//     if (finishFlush !== undefined && finishFlush === finishFlush) {
//       if (finishFlush < Z_NO_FLUSH || finishFlush > Z_BLOCK ||
//           !Number.isFinite(finishFlush)) {
//         throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
//                                     'finishFlush',
//                                     finishFlush);
//       }
//     } else {
//       finishFlush = Z_FINISH;
//     }
//
//     windowBits = opts.windowBits;
//     if (windowBits !== undefined && windowBits === windowBits) {
//       if (windowBits < Z_MIN_WINDOWBITS || windowBits > Z_MAX_WINDOWBITS ||
//           !Number.isFinite(windowBits)) {
//         throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
//                                     'windowBits',
//                                     windowBits);
//       }
//     } else {
//       windowBits = Z_DEFAULT_WINDOWBITS;
//     }
//
//     level = opts.level;
//     if (level !== undefined && level === level) {
//       if (level < Z_MIN_LEVEL || level > Z_MAX_LEVEL ||
//           !Number.isFinite(level)) {
//         throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
//                                     'level', level);
//       }
//     } else {
//       level = Z_DEFAULT_COMPRESSION;
//     }
//
//     memLevel = opts.memLevel;
//     if (memLevel !== undefined && memLevel === memLevel) {
//       if (memLevel < Z_MIN_MEMLEVEL || memLevel > Z_MAX_MEMLEVEL ||
//           !Number.isFinite(memLevel)) {
//         throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
//                                     'memLevel', memLevel);
//       }
//     } else {
//       memLevel = Z_DEFAULT_MEMLEVEL;
//     }
//
//     strategy = opts.strategy;
//     if (strategy !== undefined && strategy === strategy) {
//       if (strategy < Z_DEFAULT_STRATEGY || strategy > Z_FIXED ||
//           !Number.isFinite(strategy)) {
//         throw new errors.TypeError('ERR_INVALID_OPT_VALUE',
//                                    'strategy', strategy);
//       }
//     } else {
//       strategy = Z_DEFAULT_STRATEGY;
//     }
//
//     dictionary = opts.dictionary;
//     if (dictionary !== undefined && !isArrayBufferView(dictionary)) {
//       if (isAnyArrayBuffer(dictionary)) {
//         dictionary = Buffer.from(dictionary);
//       } else {
//         throw new errors.TypeError('ERR_INVALID_OPT_VALUE',
//                                    'dictionary',
//                                    dictionary);
//       }
//     }
//
//     if (opts.encoding || opts.objectMode || opts.writableObjectMode) {
//       opts = _extend({}, opts);
//       opts.encoding = null;
//       opts.objectMode = false;
//       opts.writableObjectMode = false;
//     }
//   }
//   Transform.call(this, opts);
//   this.bytesRead = 0;
//   this._handle = new binding.Zlib(mode);
//   this._handle.jsref = this; // Used by processCallback() and zlibOnError()
//   this._handle.onerror = zlibOnError;
//   this._hadError = false;
//   this._writeState = new Uint32Array(2);
//
//   if (!this._handle.init(windowBits,
//                          level,
//                          memLevel,
//                          strategy,
//                          this._writeState,
//                          processCallback,
//                          dictionary)) {
//     throw new errors.Error('ERR_ZLIB_INITIALIZATION_FAILED');
//   }
//
//   this._outBuffer = Buffer.allocUnsafe(chunkSize);
//   this._outOffset = 0;
//   this._level = level;
//   this._strategy = strategy;
//   this._chunkSize = chunkSize;
//   this._flushFlag = flush;
//   this._scheduledFlushFlag = Z_NO_FLUSH;
//   this._origFlushFlag = flush;
//   this._finishFlushFlag = finishFlush;
//   this._info = opts && opts.info;
//   this.once('end', this.close);
// }
// inherits(Zlib, Transform);

// Object.defineProperty(Zlib.prototype, '_closed', {
//   configurable: true,
//   enumerable: true,
//   get() {
//     return !this._handle;
//   }
// });

// Zlib.prototype.params = function params(level, strategy, callback) {
//   if (level < Z_MIN_LEVEL || level > Z_MAX_LEVEL)
//     throw new errors.RangeError('ERR_INVALID_ARG_VALUE', 'level', level);
//
//   if (strategy !== undefined &&
//       (strategy < Z_DEFAULT_STRATEGY || strategy > Z_FIXED ||
//        !Number.isFinite(strategy))) {
//     throw new errors.TypeError('ERR_INVALID_ARG_VALUE', 'strategy', strategy);
//   }
//
//   if (this._level !== level || this._strategy !== strategy) {
//     this.flush(Z_SYNC_FLUSH,
//                flushCallback.bind(this, level, strategy, callback));
//   } else {
//     process.nextTick(callback);
//   }
// };
//
// Zlib.prototype.reset = function reset() {
//   if (!this._handle)
//     assert(false, 'zlib binding closed');
//   return this._handle.reset();
// };

// function flushCallback(level, strategy, callback) {
//   if (!this._handle)
//     assert(false, 'zlib binding closed');
//   this._handle.params(level, strategy);
//   if (!this._hadError) {
//     this._level = level;
//     this._strategy = strategy;
//     if (callback) callback();
//   }
// }

// This is the _flush function called by the transform class,
// internally, when the last chunk has been written.
// Zlib.prototype._flush = function _flush(callback) {
//   this._transform(Buffer.alloc(0), '', callback);
// };

// If a flush is scheduled while another flush is still pending, a way to figure
// out which one is the "stronger" flush is needed.
// Roughly, the following holds:
// Z_NO_FLUSH (< Z_TREES) < Z_BLOCK < Z_PARTIAL_FLUSH <
//     Z_SYNC_FLUSH < Z_FULL_FLUSH < Z_FINISH
const flushiness = [];
let i = 0;
for (const flushFlag of [Z_NO_FLUSH, Z_BLOCK, Z_PARTIAL_FLUSH,
                         Z_SYNC_FLUSH, Z_FULL_FLUSH, Z_FINISH]) {
  flushiness[flushFlag] = i++;
}

function maxFlush(a, b) {
  return flushiness[a] > flushiness[b] ? a : b;
}

// function emitCloseNT(self) {
//   self.emit('close');
// }

// These should be considered deprecated
// expose all the zlib constants
// const bkeys = Object.keys(constants);
// for (var bk = 0; bk < bkeys.length; bk++) {
//   var bkey = bkeys[bk];
//   Object.defineProperty(module.exports, bkey, {
//     enumerable: true, value: constants[bkey], writable: false
//   });
// }


// #########################################################


class ZlibTransform {
  constructor (opts, mode) {
    this.sink = null
    this.source = null

    var chunkSize = Z_DEFAULT_CHUNK;
    var flush = Z_NO_FLUSH;
    var finishFlush = Z_FINISH;
    var windowBits = Z_DEFAULT_WINDOWBITS;
    var level = Z_DEFAULT_COMPRESSION;
    var memLevel = Z_DEFAULT_MEMLEVEL;
    var strategy = Z_DEFAULT_STRATEGY;
    var dictionary;

    if (typeof mode !== 'number')
      throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'mode', 'number');
    if (mode < DEFLATE || mode > UNZIP)
      throw new errors.RangeError('ERR_OUT_OF_RANGE', 'mode');

    if (opts) {
      chunkSize = opts.chunkSize;
      if (chunkSize !== undefined && chunkSize === chunkSize) {
        if (chunkSize < Z_MIN_CHUNK || !Number.isFinite(chunkSize))
          throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
                                      'chunkSize',
                                      chunkSize);
      } else {
        chunkSize = Z_DEFAULT_CHUNK;
      }

      flush = opts.flush;
      if (flush !== undefined && flush === flush) {
        if (flush < Z_NO_FLUSH || flush > Z_BLOCK || !Number.isFinite(flush))
          throw new errors.RangeError('ERR_INVALID_OPT_VALUE', 'flush', flush);
      } else {
        flush = Z_NO_FLUSH;
      }

      finishFlush = opts.finishFlush;
      if (finishFlush !== undefined && finishFlush === finishFlush) {
        if (finishFlush < Z_NO_FLUSH || finishFlush > Z_BLOCK ||
            !Number.isFinite(finishFlush)) {
          throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
                                      'finishFlush',
                                      finishFlush);
        }
      } else {
        finishFlush = Z_FINISH;
      }

      windowBits = opts.windowBits;
      if (windowBits !== undefined && windowBits === windowBits) {
        if (windowBits < Z_MIN_WINDOWBITS || windowBits > Z_MAX_WINDOWBITS ||
            !Number.isFinite(windowBits)) {
          throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
                                      'windowBits',
                                      windowBits);
        }
      } else {
        windowBits = Z_DEFAULT_WINDOWBITS;
      }

      level = opts.level;
      if (level !== undefined && level === level) {
        if (level < Z_MIN_LEVEL || level > Z_MAX_LEVEL ||
            !Number.isFinite(level)) {
          throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
                                      'level', level);
        }
      } else {
        level = Z_DEFAULT_COMPRESSION;
      }

      memLevel = opts.memLevel;
      if (memLevel !== undefined && memLevel === memLevel) {
        if (memLevel < Z_MIN_MEMLEVEL || memLevel > Z_MAX_MEMLEVEL ||
            !Number.isFinite(memLevel)) {
          throw new errors.RangeError('ERR_INVALID_OPT_VALUE',
                                      'memLevel', memLevel);
        }
      } else {
        memLevel = Z_DEFAULT_MEMLEVEL;
      }

      strategy = opts.strategy;
      if (strategy !== undefined && strategy === strategy) {
        if (strategy < Z_DEFAULT_STRATEGY || strategy > Z_FIXED ||
            !Number.isFinite(strategy)) {
          throw new errors.TypeError('ERR_INVALID_OPT_VALUE',
                                     'strategy', strategy);
        }
      } else {
        strategy = Z_DEFAULT_STRATEGY;
      }

      dictionary = opts.dictionary;
      if (dictionary !== undefined && !isArrayBufferView(dictionary)) {
        if (isAnyArrayBuffer(dictionary)) {
          dictionary = Buffer.from(dictionary);
        } else {
          throw new errors.TypeError('ERR_INVALID_OPT_VALUE',
                                     'dictionary',
                                     dictionary);
        }
      }

      // if (opts.encoding || opts.objectMode || opts.writableObjectMode) {
      //   opts = _extend({}, opts);
      //   opts.encoding = null;
      //   opts.objectMode = false;
      //   opts.writableObjectMode = false;
      // }
    }
    // Transform.call(this, opts);
    // this.bytesRead = 0;
    this._handle = new binding.Zlib(mode);
    this._handle.jsref = this; // Used by processCallback() and zlibOnError()
    this._handle.onerror = zlibOnError;
    this._hadError = false;
    this._writeState = new Uint32Array(2);

    if (!this._handle.init(windowBits,
                           level,
                           memLevel,
                           strategy,
                           this._writeState,
                           processCallback,
                           dictionary)) {
      throw new errors.Error('ERR_ZLIB_INITIALIZATION_FAILED');
    }

    this._outBuffer = Buffer.allocUnsafe(chunkSize);
    this._outOffset = 0;
    this._level = level;
    this._strategy = strategy;
    this._chunkSize = chunkSize;
    this._flushFlag = flush;
    this._scheduledFlushFlag = Z_NO_FLUSH;
    this._origFlushFlag = flush;
    this._finishFlushFlag = finishFlush;
    this._info = opts && opts.info;
    // this.once('end', this.close);

    this._ended = false
    this._pullFromHandle = false
  }

  bindSource (source) {
    source.bindSink(this)
    this.source = source

    return this
  }

  bindSink (sink) {
    this.sink = sink
  }

  close () {
    _close(this)
  }

  get _closed () {
    !this._handle
  }

  flush(kind, callback) {
    var ws = {} //this._writableState;

    if (typeof kind === 'function' || (kind === undefined && !callback)) {
      callback = kind;
      kind = Z_FULL_FLUSH;
    }

    if (ws.ended) {
      // TODO: Should be this._closed? is this even relevent anymore?
      if (callback)
        // TODO: Is this an error state...?
        process.nextTick(callback);
    } else if (ws.ending) {
      // TODO: Should be this._closed? is this even relevent anymore?
      // if (callback)
        // TODO: 'listen' for this.sink.next('end')?
        // this.once('end', callback);
    } else if (ws.needDrain) {
      // TODO: keep this state?
      const alreadyHadFlushScheduled = this._scheduledFlushFlag !== Z_NO_FLUSH;
      this._scheduledFlushFlag = maxFlush(kind, this._scheduledFlushFlag);

      // If a callback was passed, always register a new `drain` + flush handler,
      // mostly because that’s simpler and flush callbacks piling up is a rare
      // thing anyway.
      if (!alreadyHadFlushScheduled || callback) {
        const drainHandler = () => this.flush(this._scheduledFlushFlag, callback);
        // this.once('drain', drainHandler);
      }
    } else {
      this._flushFlag = kind;
      // this.write(Buffer.alloc(0), '', callback);
      // ^ this called _transform()
      this._transform(Buffer.alloc(0), 'flush', callback);

      this._scheduledFlushFlag = Z_NO_FLUSH;
    }
  }

  next (status, error, buffer, bytes) {
    console.log((new Error('ZlibTransform next')).stack)
    if (error !== null) {
      this.close()
      return this.sink.next(status, error)
    }
    if (status === 'end') {
      this._ended = true
      // if (this._bytes === 0) {
      //   return this.sink.next(status)
      // }
      //
      // // transform buffer
      //
      // this.pull(null, buffer)
      // this.close()
    }
    if (buffer === null) buffer = Buffer.alloc(0)
    if (bytes < 0) bytes = 0

    console.log('@ bytes ength sliceLength', bytes, buffer.length, buffer.slice(0, bytes).length)

    this._transform(buffer.slice(0, bytes), status, (error, pullMore) => {
      if (error) {
        this.close()
        return this.sink.next(status, error)
      }

      console.log('transform CB()', status, this._ended)
      if (status === 'end') return

      // this.sink.next('continue', null, Buffer.alloc(0), 0)

      console.log('PULLING more')
      if (pullMore) this.source.pull(null, Buffer.alloc(1024 * 16))
    })

    // if (this._bytes + bytes > this._buffer.length) {
    //   const prevBuffer = this._buffer
    //   const reallocSize = this._buffer.length + this._reallocateSize
    //   const neededSize = this._bytes + bytes
    //   this._buffer = new Buffer.allocUnsafe(neededSize > reallocSize ? neededSize + reallocSize : reallocSize)
    //   prevBuffer.copy(this._buffer, 0, 0, neededSize)
    // }
    //
    // buffer.copy(this._buffer, this._bytes, 0, bytes)
    // this._bytes += bytes
    //
    // if (status === 'continue') {
    //   return this.source.pull(null, buffer)
    // }
  }

  _transform(chunk, status, cb) {
    // If it's the last chunk, or a final flush, we use the Z_FINISH flush flag
    // (or whatever flag was provided using opts.finishFlush).
    // If it's explicitly flushing at some other time, then we use
    // Z_FULL_FLUSH. Otherwise, use the original opts.flush flag.
    var flushFlag;
    var ws = {} //this._writableState;
    // if ((ws.ending || ws.ended) && ws.length === chunk.byteLength) {
    if (status === 'end') {
      console.log('TRANSFORM FINAL FLUSH')
      // XXX: Should be on 'end' message?
      flushFlag = this._finishFlushFlag;
    } else {
      flushFlag = this._flushFlag;
      // once we've flushed the last of the queue, stop flushing and
      // go back to the normal behavior.
      // if (chunk.byteLength >= ws.length)
      //   this._flushFlag = this._origFlushFlag;
    }
    processChunk(this, chunk, flushFlag, cb);
  }

  pull (error, buffer) {
    // if (this._bytes === 0) {

    if (this._pullFromHandle) {
      console.log('DOING PULL FROM HANDLE', this._outBuffer.length, this._outOffset, this._chunkSize)
      return this._handle.write(this._handle.flushFlag,
                                this._handle.buffer, // in
                                this._handle.inOff, // in_off
                                this._handle.availInBefore, // in_len
                                this._outBuffer, // out
                                this._outOffset, // out_off
                                this._chunkSize); // out_len
    }

    if (this._ended) {
      console.log((new Error('TRANSFORM END')).stack, error)
      this.sink.next('end', null, Buffer.alloc(0), 0)
      return
    }

    return this.source.pull(error, error ? undefined : buffer || Buffer.alloc(1024 * 16))
    // }

    // if (this._readPos >= this._bytes) {
    //   this.sink.next('end')
    // }

    // this._buffer.copy(buffer, 0, this._readPos)
    //
    // this._readPos += buffer.length
    //
    // this.sink.next('continue', null, buffer, buffer.length)
  }
}

module.exports = ZlibTransform

function processChunk(self, chunk, flushFlag, cb) {
  var handle = self._handle;
  if (!handle)
    return cb(new errors.Error('ERR_ZLIB_BINDING_CLOSED'));

  handle.buffer = chunk;
  handle.cb = cb;
  handle.availOutBefore = self._chunkSize - self._outOffset;
  handle.availInBefore = chunk.length;
  handle.inOff = 0;
  handle.flushFlag = flushFlag;

  console.log((new Error('write in processChunk')).stack)
  handle.write(flushFlag,
               chunk, // in
               0, // in_off
               handle.availInBefore, // in_len
               self._outBuffer, // out
               self._outOffset, // out_off
               handle.availOutBefore); // out_len
}

function zlibOnError(message, errno) {
  var self = this.jsref;
  // there is no way to cleanly recover.
  // continuing only obscures problems.
  _close(self);
  self._hadError = true;

  const error = new Error(message);
  error.errno = errno;
  error.code = codes[errno];
  // XXX: propogate the error up
  self.source.pull(error, null)
  // self.emit('error', error);
}

function _close(engine, callback) {
  // Caller may invoke .close after a zlib error (which will null _handle).
  console.log((new Error('_close()')).stack)

  if (!engine._handle)
    return;

  engine._handle.close();
  engine._handle = null;
}

function processCallback() {
  console.log('processCallback()')
  // This callback's context (`this`) is the `_handle` (ZCtx) object. It is
  // important to null out the values once they are no longer needed since
  // `_handle` can stay in memory long after the buffer is needed.
  var handle = this;
  var self = this.jsref;
  var state = self._writeState;

  var pullMore = true

  if (self._hadError) {
    this.buffer = null;
    return;
  }

  if (self.destroyed) {
    this.buffer = null;
    return;
  }

  var availOutAfter = state[0];
  var availInAfter = state[1];

  var inDelta = (handle.availInBefore - availInAfter);
  self.bytesRead += inDelta;

  var have = handle.availOutBefore - availOutAfter;
  if (have > 0) {
    var out = self._outBuffer.slice(self._outOffset, self._outOffset + have);
    self._outOffset += have;

    pullMore = false

    console.log('TRANSFORM WRITE', availOutAfter === 0, util.format(out), out.length)

    self.sink.next('continue', null, out, out.length)
  } else if (have < 0) {
    assert(false, 'have should not go down');
  }

  // exhausted the output buffer, or used all the input create a new one.
  if (availOutAfter === 0 || self._outOffset >= self._chunkSize) {
    handle.availOutBefore = self._chunkSize;
    self._outOffset = 0;
    self._outBuffer = Buffer.allocUnsafe(self._chunkSize);
  }

  self._pullFromHandle = false

  if (availOutAfter === 0) {
    // Not actually done. Need to reprocess.
    // Also, update the availInBefore to the availInAfter value,
    // so that if we have to hit it a third (fourth, etc.) time,
    // it'll have the correct byte counts.
    handle.inOff += inDelta;
    handle.availInBefore = availInAfter;

    self._pullFromHandle = true

    console.log((new Error('pull more from handle on pull()')).stack)

    if (have === 0) self.sink.next('continue', null, Buffer.alloc(0), 0)

    return;
  }

  // finished with the chunk.
  console.log('CHUNK CLEANUP')
  this.buffer = null;
  this.cb(null, pullMore);
}


// *******************************************

// generic zlib
// minimal 2-byte header
// function Deflate(opts) {
//   if (!(this instanceof Deflate))
//     return new Deflate(opts);
//   Zlib.call(this, opts, DEFLATE);
// }
// inherits(Deflate, Zlib);
//
// function Inflate(opts) {
//   if (!(this instanceof Inflate))
//     return new Inflate(opts);
//   Zlib.call(this, opts, INFLATE);
// }
// inherits(Inflate, Zlib);
//
// function Gzip(opts) {
//   if (!(this instanceof Gzip))
//     return new Gzip(opts);
//   Zlib.call(this, opts, GZIP);
// }
// inherits(Gzip, Zlib);
//
// function Gunzip(opts) {
//   if (!(this instanceof Gunzip))
//     return new Gunzip(opts);
//   Zlib.call(this, opts, GUNZIP);
// }
// inherits(Gunzip, Zlib);
//
// function Unzip(opts) {
//   if (!(this instanceof Unzip))
//     return new Unzip(opts);
//   Zlib.call(this, opts, UNZIP);
// }
// inherits(Unzip, Zlib);

// module.exports = {
//   Deflate,
//   Inflate,
//   Gzip,
//   Gunzip,
//   DeflateRaw,
//   InflateRaw,
//   Unzip
// };

Object.defineProperties(module.exports, {
  constants: {
    configurable: false,
    enumerable: true,
    value: constants
  },
  codes: {
    enumerable: true,
    writable: false,
    value: Object.freeze(codes)
  }
});
