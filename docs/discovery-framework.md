# EPOCH Discovery Framework

**Status: Current cross-stage requirements plus technical options.** This document does not select an unverified trigger implementation. The detailed M0 evidence and runtime boundaries remain in the linked [technical reference](technical-reference.md), [M0-B evidence](evidence/m0-b-engine-verification.md), and [M0-C historical test record](testing/m0-c-runtime-test.md).

## Binding requirements

- Begin through delayed events and discoveries, not a start technology, new origin, civic, or free start bonus.
- Organic empires, Hive Minds, and Machine Intelligences can participate under shared eligibility rules.
- Each empire has its own campaign state, schedule, and outcomes. No global singleton can block another eligible empire.
- Recheck owner, eligibility, current stage, and referenced objects when delayed callbacks execute.
- AI receives the same opportunities/prerequisites and has a safe route through blocking choices.
- Avoid routine global polling. Calendar time can pace discovery but cannot replace chapter objectives.
- Synchronization, deterministic scheduling, save/load recovery, and MP safety must be demonstrated in game before claims are made.

## Implementation candidates (not a binding syntax decision)

The source-reviewed candidate is country-local event scheduling from an appropriate country hook. Hook merge behavior, coverage, exact-once behavior, delay/randomization grammar, callbacks, target lifetime, performance, save/load, and MP synchronization require target-build validation. A bounded low-frequency eligibility pulse is an alternative only if the hook path fails validation; its additional recurring work and multiplayer behavior also require tests. Neither option is approved as a verified runtime mechanism by this document.

## Recovery and safety

Persist only the state needed to resume an empire's active stage. Duplicate dispatch must be harmless. Stale callbacks recheck state. Missing/destroyed/captured targets take the stage-defined fallback. Interrupted registration and damaged legacy records need an explicit policy. Never use another empire's targets or state. Exact record schema and recovery behavior are open technical design decisions governed by the architecture invariants and current stage specifications.
