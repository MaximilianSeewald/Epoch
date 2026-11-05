# ADR-002: Keep UAP state empire-scoped and transition-guarded

- **Status:** Proposed; storage/atomicity validation open
- **Date:** 2026-11-06
- **Scope:** EPOCH Core progression

## Context

The existing discovery framework proposes country/empire-owned progression,
but its model does not define a terminal UAP completion state, transition
guards, resumability, or detailed failure behavior. M0-B source examples show
flags, situations, and callbacks, not their complete persistence or atomicity
semantics in runtime.

## Decision

Use one conceptual state record per empire with states `Not scheduled`,
`Scheduled`, `Discovered`, `Investigating`, `Resolved`, `Paused / Invalidated`,
and `Completed`. Each accepted transition checks expected prior state, schema
version, transition sequence, active object identity where relevant, and a
unique operation key. `Completed` is terminal. Pauses carry a reason and
explicit resumability policy. Concrete storage names and script syntax are
deferred until verified.

## Consequences

- Replay and stale callbacks become explicit no-op or quarantine cases.
- One-time effects require their own operation keys; script atomicity cannot be
  assumed and needs interruption/replay testing.
- The state model can describe save migration and recovery without a global
  poller.
- State storage, operation-key limits, and object-reference lifetime need
  implementation-time design and runtime tests.

## Alternatives considered

- **Independent flags per event:** rejected as the primary model because flags
  alone do not describe valid order, active stage, pause reason, or terminal
  completion.
- **One global galaxy state:** rejected because empires progress independently
  and country-local scheduling is the design goal.
- **Implicit recovery by replaying start events:** rejected because it risks
  duplicate rewards and assumes event atomicity/persistence.

## Evidence

The state machine is an EPOCH proposal. M0-B source evidence for flags and
event/situation callbacks is not proof of runtime persistence, transactionality,
or multiplayer behavior.
