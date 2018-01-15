# bob

A Work-In-Progress binary data "streams+" implementation via data producers, data consumers, and pull flow.

_The name? something something b~~l~~ob, credit Matteo Collina._

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

API examples (sometimes functional) sit in the top-level directory.

Functional sources, sinks, and combinations relating to Node.js subsystems sit in subsystem-named directories. Examples include `/fs/` and `/stdio/`.

### Tests

Tests sit in the `/test/` directory.
For more information, see the [tests readme](tests/readme.md).

## License

[MIT Licensed](license)
_[Contributions via DCO 1.1](contributing.md#developers-certificate-of-origin)_
