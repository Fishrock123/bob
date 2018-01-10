# bob

A Work-In-Progress "streams+" implementation via data producers, data consumers, and pull flow.

_The name? something something b~~l~~ob, credit Matteo Collina._

## Goals
Some collective goals for this initiative.

### Protocol
As a preface, "protocol" refers to a system with "producer / source" and "consumer / sink" endpoints, where the consumer "pulls" from the producer.

- Protocol and protocol state must be simple, certainly simpler than streams3.
- Focused on interaction of protocol endpoints rather than full-stream management.
- Buffering of data (for any reason) is done outside of the protocol.
  - (Either between, or at the ends of protocol interaction.)
- Errors and data should flow through the same call path.
- Callbacks should be the "EOF" mechanism.

### Consumer
- Should make no assumption on the timing of when data will be received, down to being fully synchronous.
- Should own any preallocated memory (the buffer).
- Must never make more than one data request upstream at the same time.

## Unsolved Issues
- Unknown how best to integrate timeouts at the current time.

## Project Layout

API examples (sometimes functional) sit in the top-level directory.

Functional sources, sinks, and combinations relating to Node.js subsystems sit in subsystem-named directories. Examples include `/fs/` and `/stdio/`.

### Tests

Tests sit in the `/test/` directory.
For more information, see the [tests readme](tests/readme.md).

## License

[MIT Licensed](license)
_[Contributions via DCO 1.1](contributing.md#developers-certificate-of-origin)_
