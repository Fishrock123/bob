# BOB

A Work-In-Progress binary data "streams+" implementation via data producers, data consumers, and pull flow.

_The name? something something B~~L~~OB, credit Matteo Collina._

This is [a Node.js strategic initiative](strategic-initiatives) aiming to improve Node.js streaming data interfaces, both within Node.js core internally, and hopefully also as future public APIs.

## API Reference

The following files serve as the API's reference:
- A [Source](reference-source.js) - _The data provider_
- A [Sink](reference-sink.js) - _The data consumer_
- A [Passthrough](reference-passthrough.js) - _A good example of the whole API_
- A [Buffered Transform](reference-buffered-transform.js) - _An example of buffering_

The composition of the classes looks like this:
```js
const source = new Source(/* args */)
const sink = new Sink(/* args */)

sink.bindSource(source, error => {
  // The stream is finished when this is called.
})
```

## Performance

Please see [performance.md](performance.md) for profiling results & information.

Current results estimate a 30% decrease of CPU time in bad cases, and up to 8x decrease in good cases. This should correlate to overall throughput but may not be exact.

## Project Approach

High-level timeline:
- Prototype separate from core entirely.
- Move into nodejs org once JS & C++ APIs are significantly prototyped.
- Begin transitioning Node.js internals once the APIs and perf are proved.
- If an internal transition works out well, begin planning public APIs.

All of these steps necessitate the buy-in of many stakeholders, both in Node.js core and the greater Node.js ecosystem. This is a long-term project by necessity and design.

## Goals
Some collective goals for this initiative.

- Both performance and ease-of-use are key motivating goals.
- Implementable in a performant and usable way for both JS and C++.
- Browser portability is preferable.

### Protocol
As a preface, "protocol" refers to a system with "producer / source" and "consumer / sink" endpoints.

The Protocol must be simple:
- Pull-based: The consumer requests ("pulls") data from the producer.
- Binary-only: Data is binary buffers only, "object mode" and string encodings are not supported at the protocol level.
- Stateless: The protocol must not require state to be maintained out-of-band.
- One-to-one: The protocol assumes a one-to-one relationship between producer and consumer.
- Timing agnostic: The protocol makes no timing (sync or async) assumptions.
- No buffering: The protocol must not require buffering (although specific implementations might).
- In-line errors and EOF: Errors, data, and EOF should flow through the same call path.

### Consumer
- Should make no assumption on the timing of when data will be received (sync or async).
- Should own any preallocated memory (the buffer).
- Must never make more than one data request upstream at the same time.

## Unsolved Issues
- Unknown how best to integrate timeouts at the current time.

## Project Layout

API reference examples sit in the top-level directory and are prefixed by `reference-`. The reference passthrough should be functional.

Functional sources, sinks, and combinations relating to Node.js subsystems sit in subsystem-named directories. Examples include `/fs/` and `/stdio/`.

### Tests

Tests sit in the `/test/` directory.
For more information, see the [tests readme](tests/readme.md).

## License

[MIT Licensed](license) — _[Contributions via DCO 1.1](contributing.md#developers-certificate-of-origin)_

[strategic-initiatives]: https://github.com/nodejs/TSC/blob/master/Strategic-Initiatives.md#current-initiatives
