'use strict'

// NOT WORKING.
// Potential experimental code shapes only.

// This is just confusing...
async * iter (source) {
  while (true) {
    try {
      const buffer = yield

      await source.next(buffer)

      yield source.next()
    } catch (err) {
      // cleanup
      source.throw(err)
    }
  }
}

// With async iters...?
async * iter (source_iter) {
  for await (chunk_data of source_iter) {
    try {
      const buffer = yield chunk_data

      continue buffer
    } catch (err) {
      // cleanup
      source.throw(err)
    }
  }
}
