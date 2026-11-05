# Technical architecture

This document records the proposed EPOCH design. It is not a claim that the
proposed systems or syntax have been tested in Stellaris 4.5.3. See
[`technical-reference.md`](technical-reference.md) for verification status and
the engine research gate.

## Principles

1. **Core first:** EPOCH Core must run without Gigastructures.
2. **Isolated integration:** all Gigastructures-specific definitions belong to a
   separately enabled compatibility bridge. Core must not name or require its
   content.
3. **Event-led progression:** discovery begins through events. Prefer one-time,
   scoped scheduling and follow-up events over frequent global polling.
4. **Shared eligibility and rules:** organic empires, Hive Minds, and Machine
   Intelligences follow the same gates and progression rules. Narrative and
   consequences may account for their differences.
5. **AI parity:** AI empires receive the same eligibility checks and progression
   opportunities as player empires; AI weights and automation are design
   requirements pending engine verification.
6. **Staggered experience:** each eligible empire receives an individually
   delayed discovery in a common early-game window, rather than a simultaneous
   galaxy-wide reveal.
7. **Gradual reveal:** early content presents a local mystery and manageable
   challenge. It does not reveal the final ascension or its purpose.
8. **Localisation:** player-facing text is supplied in English and German.

## Proposed progression stages

| Stage | Working name | Approximate period |
|---|---|---:|
| I | The First Echo | 2203–2208 |
| II | The Contamination | 2207–2215 |
| III | The Pattern | 2215–2230 |
| IV | The Integration | 2230–2250 |
| V | The Convergence | Mid/late game |
| VI | The Ascension | Late game |

Dates are narrative targets, not engine-verified locks. The discovery framework
proposal describes timing and state transitions; implementation must be revised
if 4.5.3 verification requires a different mechanism.

## Discovery architecture (proposed)

Use a single low-frequency campaign bootstrap to enumerate eligible empires once
after game start and schedule one delayed discovery event per empire. Store each
empire's pending/started state on that empire. At the scheduled event, recheck
the shared eligibility rules, mark the discovery active, and start the first
narrative beat. Subsequent progression is driven by explicit event outcomes and
completion callbacks, not a continuously repeated all-empire scan. Timing
randomisation must be deterministic in multiplayer or derived from synchronized
game state. The exact supported scheduler, random functions, scope, and persistence
methods are unverified until checked against 4.5.3 files and an in-game multiplayer
run.

No technology is used to initiate discovery. No starting civic, trait, origin, or
bonus is added. The late-game purpose remains hidden during early stages.

## Gigastructures boundary

Core definitions must contain no hard references to Gigastructures identifiers,
events, megastructures, components, or localisation keys. The optional bridge is a
separately packaged/enabled integration layer under
`compatibility/gigastructures/`. It may refer to Core's documented interface and
Gigastructures content only after both sides and their load/activation behavior
are verified. If Gigastructures is absent, the bridge is inactive and Core
continues to work. Do not put an external launcher `.mod` file inside Workshop
source without a documented packaging reason. This boundary is architectural
intent, not yet tested compatibility behavior.

## Implementation gate

Before gameplay scripts are written, inspect the Stellaris 4.5.3 installation and
verify: descriptor conventions; recognised script directories; event namespaces,
types, and registration; on_action definitions and load behavior; scopes and scope
transitions; triggers/effects; scripted triggers/effects; flags, variables, and
event targets; situations/stages; special projects; localisation encoding/key
syntax; AI weights/automation; and multiplayer determinism/performance. Record the
source file and a minimal in-game validation for each feature. Do not treat this
proposal or older community examples as proof of 4.5.3 support.
