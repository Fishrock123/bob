# BOB

A binary data "streams+" API & implementations via data producers, data consumers, and pull flow.

_The name? something something B~~L~~OB, credit Matteo Collina._

This is [a Node.js strategic initiative](https://github.com/nodejs/TSC/blob/master/Strategic-Initiatives.md#current-initiatives) aiming to improve Node.js streaming data interfaces, both within Node.js core internally, and hopefully also as future public APIs.

## Published Modules

The following modules are published to npm and are _technically usable_.
- The status codes enum: [bob-status](https://github.com/Fishrock123/bob-status)
- A file system source: [fs-source](https://github.com/Fishrock123/fs-source)
- A file system sink: [fs-sink](https://github.com/Fishrock123/fs-sink)
- A zlib transform: [zlib-transform](https://github.com/Fishrock123/zlib-transform)

The following modules are not published but are functioning.
- A TCP socket "duplex": [in "socket"](https://github.com/Fishrock123/socket)
- A TCP server of "duplex" sockets: [also in "socket"](https://github.com/Fishrock123/socket)

## API Reference

The following files serve as the API's reference:
- The [Status Enum](reference-status-enum.js) - _Status codes_
- A [Source](reference-source.js) - _The data provider_
- A [Sink](reference-sink.js) - _The data consumer_
- A [Passthrough](reference-passthrough.js) - _A good example of the whole API_
- A [Buffered Transform](reference-buffered-transform.js) - _An example of buffering_

### Examples

The composition of the classes looks like this:
```js
const source = new Source(/* args */)
const sink = new Sink(/* args */)

sink.bindSource(source, error => {
  // The stream is finished when this is called.
})
```

An entire passthrough could look like this:
```js
class PassThrough {
  bindSource (source) {
    source.bindSink(this)
    this.source = source
    return this
  }

  bindSink (sink) {
    this.sink = sink
  }

  next (status, error, buffer, bytes) {
    this.sink.next(status, error, buffer, bytes)
  }

  pull (error, buffer) {
    this.source.pull(error, buffer)
  }
}
```

## API Extension Reference

The following files serve as API extension references:
- [extension-start](reference-extension-start.js) - _Explicitly_ start a sink
  * Useful for e.g. Socket start after setup.
  * A Sink implementing this extension _may require_ its use to start.
- [extension-stop](reference-extension-stop.js) - Tell a source to stop.
  * Useful for dealing with timeouts on network APIs.

## Project Approach

High-level timeline:
- Prototype separate from core entirely.
- Move into nodejs org once JS & C++ APIs are significantly prototyped.
- Begin transitioning Node.js internals once the APIs and perf are proved.
- If an internal transition works out well, begin planning public APIs.

All of these steps necessitate the buy-in of many stakeholders, both in Node.js core and the greater Node.js ecosystem. This is a long-term project by necessity and design.

## Goals
Some collective goals for this initiative.

- Both performance and ease-of-use are key.
- Implementable in a performant and usable way for both JS and C++.
- Browser portability is preferable.

### Protocol
_As a preface, "protocol" refers to a system with "producer / source" and "consumer / sink" endpoints._

The Protocol itself must be simple:
- Pull-based: The consumer requests ("pulls") data from the producer.
- Binary-only: Data is binary buffers only, "object mode" and string encodings are not supported at the protocol level.
- Stateless: The protocol must not require state to be maintained out-of-band.
  - _Non-normative: While to protocol itself does not require out-of-band state, actual operations almost always do._
  - Minimize state assumed between calls.
- One-to-one: The protocol assumes a one-to-one relationship between producer and consumer.
- Timing agnostic: The protocol makes no timing (sync or async) assumptions.
- No buffering: The protocol must not require buffering (although specific implementations might).
  - _Non-normative: While to protocol itself does not require buffering, starting sources almost always do (including transforms)._
- In-line errors and EOF: Errors, data, and EOF ("end") should flow through the same call path.

### Consumer
- Should make no assumption on the timing of when data will be received (sync or async).
- Should own any preallocated memory (the buffer).
- Must never make more than one data request upstream at the same time.

## Performance

Please see [performance.md](performance.md) for profiling results & information.

Current results estimate a 30% decrease of CPU time in bad cases, and up to 8x decrease in good cases. This should correlate to overall throughput but may not be exact.

## Project Layout

API reference examples sit in the top-level directory and are prefixed by `reference-`. The reference passthrough should be functional.

Functional sources, sinks, and combinations relating to Node.js subsystems sit in subsystem-named directories. Examples include `/fs/` and `/stdio/`.

### Development

You must have a local install of Node master @ ~ 694ac6de5ba2591c8d3d56017b2423bd3e39f769

#### Building the addons

```
npm i node-gyp
node-gyp rebuild --nodedir=your/local/node/dir -C ./addons/passthrough
node-gyp rebuild --nodedir=your/local/node/dir -C ./addons/fs-sink
node-gyp rebuild --nodedir=your/local/node/dir -C ./addons/fs-source
```

#### Tests

Tests sit in the `/test/` directory.
For more information, see the [tests readme](tests/readme.md).

## License

[MIT Licensed](license) — _[Contributions via DCO 1.1](contributing.md#developers-certificate-of-origin)_
