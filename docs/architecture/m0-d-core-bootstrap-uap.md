# M0-D Core Bootstrap and UAP Architecture

**Status:** Architecture proposal for M0-D. No gameplay implementation is part
of this phase. Conceptual state labels below are documentation terms, not
Stellaris script identifiers.

## Scope and evidence boundary

This document turns the existing Core-first and event-led principles into a
concrete design for initialization and empire-level UAP progression. It does
not specify story events, costs, rewards, project definitions, situation
definitions, or executable script syntax.

Evidence labels retain the meanings in
[`../evidence/m0-b-engine-verification.md`](../evidence/m0-b-engine-verification.md):
**VERIFIED – SOURCE** means a pattern exists in the inspected source subset;
**OBSERVED IN GAME (tester-reported)** means only the general M0-C confirmation
is known; **PROPOSED** is an architectural recommendation; **UNVERIFIED** means
the runtime behavior or underlying evidence is absent.

### Existing evidence

- **VERIFIED – SOURCE (M0-B):** Vanilla defines `on_game_start_country` as a
  country event-dispatch hook. Vanilla also contains day-delayed country-event
  examples, event/situation patterns, persistent flag examples, and situation
  and special-project callbacks. These observations do not establish mod hook
  merge behavior, exact-once execution, predicate correctness, persistence,
  multiplayer safety, or cost. See the M0-B evidence matrix and
  [`../technical-reference.md`](../technical-reference.md).
- **OBSERVED IN GAME (tester-reported, M0-C):** the tester reported that a
  runtime campaign was conducted successfully. No individual case, log, save,
  empire class, or multiplayer result was supplied. The M0-C record therefore
  leaves parser acceptance, additive hook registration, delivery, repeat
  dispatch, coverage, situation behavior, and save/load outcomes as NOT
  SPECIFIED. See [`../testing/m0-c-runtime-test.md`](../testing/m0-c-runtime-test.md).
- **UNVERIFIED:** all operational properties listed above remain open unless
  there is a case-specific recorded result. Nothing in this architecture
  upgrades M0-B or M0-C evidence status or claims a Stellaris 4.5.3 behavior.

## Design invariants

1. Bootstrap, eligibility, UAP state, and progression are country/empire scoped.
   Record lifecycle is separate from progression: absent, initialized,
   interrupted, damaged, and migrated are not interchangeable with a progression
   state such as `Not scheduled`.
2. Organic empires, Hive Minds, and Machine Intelligences use one shared
   eligibility policy. Player and AI empires use the same gates and state
   transitions.
3. A country can have at most one active UAP schedule and one active UAP
   progression instance.
4. Every transition is guarded by current state and an idempotency key; repeated
   callbacks do not repeat one-time effects, rewards, or event presentation.
5. Eligibility is checked at scheduling and again when a delayed callback is
   delivered. A stale callback cannot bypass a changed gate.
6. Progression is event-driven. There is no routine global daily/monthly scan.
7. Gameplay state is authoritative synchronized country state; no client-local
   gameplay decisions or state are used.
8. Core has no dependency on Gigastructures. Compatibility is isolated behind
   an optional, separately packaged integration.

## Bootstrap lifecycle

### Proposed new-game path

1. **Dispatch:** the existing `on_game_start_country` is the preferred
   candidate entry point because the source defines it per country.
2. **Context validation:** bootstrap accepts only a valid empire country with a
   usable country identity. Exact predicates for invalid, observer, unowned,
   fallen, crisis, enclave, and other special countries must be selected from
   verified 4.5.3 definitions before implementation.
3. **Duplicate guard:** distinguish no state record from a valid initialized
   record. If a record already exists, classify it and follow its recovery path;
   never treat damaged or interrupted data as absent. A transition guard and
   scheduling intent are persisted before requesting the delayed callback.
4. **Eligibility:** invoke the single shared eligibility policy. It treats
   organics, Hive Minds, and Machine Intelligences as supported classes and
   does not branch on human versus AI control. Eligibility outcomes carry a
   stable reason code for diagnostics.
5. **Schedule:** for an eligible empire, persist a `Scheduled` state with
   `registration = unconfirmed`, generation/key, bounded target time/order, and
   retry count zero. Then request the delayed callback. Do not infer from the
   request returning that the engine has durably registered it; only delivery
   proves that a callback arrived. This ordering makes a save interruption
   visible as an outstanding registration intent. The exact delay mechanism and
   per-empire staggering method remain subject to parser and multiplayer
   validation. A fixed, deterministic offset is the first candidate; do not
   assume a random-delay form is safe.
6. **Delivery:** the callback carries the same generation and callback key on
   every registration attempt. It verifies its key is current, confirms state
   is still `Scheduled`, and re-runs the same eligibility rule. If all checks
   pass, it commits the delivery transition and emits the first discovery
   presentation through separate idempotency keys. If a check fails, it moves
   to a reasoned pause/invalidation with no progression side effects. Duplicate
   deliveries for the same key are no-ops after the first accepted transition.

If handler merge behavior is not additive, the feature must not replace the
Vanilla handler list. Stop at the integration gate and choose a verified
registration mechanism; do not ship an override that silently removes existing
handlers.

### Eligibility contract

Eligibility is a pure decision at a specified country scope: it reads country
facts, returns eligible/ineligible plus a reason, and does not mutate state,
grant content, schedule events, or depend on player status. The policy has three
parts:

- **Common validity gate:** country exists, is an empire that can own
  progression, is not in a terminal/excluded game role, and has no conflicting
  EPOCH record.
- **Supported class gate:** regular organic, Hive Mind, or Machine Intelligence
  class, using predicates verified for the target build. Subclasses are not
  excluded unless a documented design rule requires it.
- **Campaign gate:** campaign timing and any explicit global compatibility or
  version gate. No technology, civic, trait, origin, starting bonus, or human
  control requirement is used to enter.

The exact script predicates, semantics for newly created/subject/special
empires, and all category coverage are **UNVERIFIED**. Implement one named
eligibility interface and test its truth table against organic, Hive, machine,
AI, player, and excluded-country examples. Do not maintain separate player and
AI filters.

### Delayed entry, save/load, and running campaigns

- Treat a queued delayed callback and the state record as save data only after
  this is confirmed in the target runtime. Do not schedule again merely because
  a load occurred.
- **Scheduling recovery decision:** represent the state write and delayed-event
  request as a small recoverable protocol. First persist `Scheduled` plus the
  generation, callback idempotency key, target, `registration = unconfirmed`,
  and retry count. Then request registration. A later callback with that key is
  the only positive evidence of delivery; no engine acknowledgement is
  assumed. If execution is interrupted between the write and the request, or
  registration outcome is otherwise unknown, a one-shot reconciliation entry
  point may make at most one retry using the *same* generation and callback
  key. Both the original and retry may be queued; the delivery guard accepts
  only the first valid transition and treats later copies as stale/duplicate.
  Persist the retry count before issuing that retry. After the bounded retry,
  leave the record interrupted/paused with a diagnostic and do not keep
  rescheduling. This design is safe only if state writes, callback payload,
  callback persistence, and deduplicated delivery survive interruption and
  save/load as required. Those properties and a synchronized one-shot
  reconciliation entry point are **RUNTIME GATES**. If any fail, disable
  automatic re-registration and leave the schedule paused for explicit,
  supported recovery; do not guess that the callback is absent.
- A callback after load follows the same key, state, and eligibility checks as
  any other delivery. If no recovery entry point can be verified, keep the
  schedule unresolved instead of polling or blindly requeueing it.
- Do not use the single-player save-load hook as a recovery mechanism; M0-B
  source explicitly warns that it does not run on MP save loads due to OOS
  concerns.
- Existing campaigns created before EPOCH is enabled are **not implicitly
  initialized by this design**. First release behavior is opt-in migration:
  provide a deliberate one-shot migration entry point only after a synchronized
  4.5.3-safe invocation path is verified. It calls the same duplicate guard and
  eligibility policy. Until then, document that existing campaigns are not
  supported for bootstrap. Never compensate with a recurring global scan.
- A save containing an older EPOCH state version is classified as `Migrated`
  only after a versioned migration map has completed and its result has been
  validated. Unknown or corrupt versions are classified as `Damaged` and
  quarantined; never reset them to `Not scheduled` and risk replaying rewards.

### Error and recovery policy

| Condition | Required handling |
|---|---|
| Duplicate hook or callback | No-op using state plus operation key; record a diagnostic counter/reason only if that is safe and bounded. |
| Interrupted callback registration | Keep the persisted `unconfirmed` intent; use at most one same-key retry from a verified one-shot reconciliation entry point. If the gate is not met, pause without retry. |
| Eligibility lost before delivery | Mark paused/invalidated with reason; do not emit discovery or grant effects. |
| Delayed callback key is stale | No-op; do not change newer state. |
| Unsupported/corrupt saved schema | Classify as Damaged; quarantine and preserve original data where possible. Do not initialize over it. |
| Valid but incomplete in-progress write/operation | Classify as Interrupted; retain last committed progression state and operation journal, then resume/retry only its guarded operation through an approved recovery entry point. |
| Legacy record migrated successfully | Classify as Migrated with source and destination schema versions and a completed migration key; normal progression is available only after validation. |
| Missing downstream Situation/Project definition | Keep progression recoverable and paused with the missing integration identifier; do not mark success. Exact engine-safe detection needs validation. |
| Callback or event is delivered twice | Transition guard and one-time operation key prevent duplicate presentation, rewards, or object creation. |
| Permanent loss/removal of country | Mark terminal invalidation if country scope is still addressable; otherwise rely on engine cleanup and treat cleanup semantics as an open test. |
| Unexpected event failure | Keep the last committed state and typed operation key; retry only if failure proves the operation did not execute or its specific operation is verified idempotent. Otherwise pause for diagnosis; never implicitly replay a possibly completed effect. |

Error logging must be concise and bounded: empire identity, UAP schema/state,
operation key, event/transition name, reason code, and game version where
available. Do not write per-tick logs.

## UAP empire state machine

State is empire-specific and has two separate dimensions:

- **Record lifecycle:** `Absent` (no record exists), `Initialized` (a new
  supported-schema record is valid), `Interrupted` (a known operation began but
  did not reach its commit marker), `Damaged` (schema or invariants cannot be
  trusted), and `Migrated` (a legacy record was transformed and validated).
  Lifecycle is metadata about record integrity/recovery, not a progression
  state. `Not scheduled` exists only inside an initialized or migrated valid
  record. Damaged data is never treated as absent. Migration failure remains
  Damaged; Interrupted is resumed only from its recorded operation checkpoint.
- **Progression state:** one of the states in the table below. A record must
  pass lifecycle/schema validation before transitions are accepted.

| Record lifecycle | Meaning | Allowed handling |
|---|---|---|
| **Absent** | No EPOCH UAP record is stored for this empire. | Shared eligibility and bootstrap guard decide whether to create a new Initialized record. Absence alone never authorizes replay of a known prior record. |
| **Initialized** | A newly created record passed schema and invariant checks. | Normal progression transitions are allowed. |
| **Interrupted** | A durable operation intent exists without a durable completion marker. | Keep the last committed progression state. Resume only from that operation's checkpoint and only if its operation-specific recovery is runtime-verified; otherwise remain paused. |
| **Damaged** | Required fields, schema, or invariants are missing or contradictory. | Quarantine read-only, preserve diagnostics, and require a versioned repair/migration policy. Never initialize over the record. |
| **Migrated** | A known source schema was transformed and validated into the current schema. | Normal progression is allowed after migration completion is committed. Replaying the same migration key is a no-op. |

The transitions are `Absent → Initialized`; `Initialized → Interrupted →
Initialized` only after safe recovery; and a known legacy record is marked
`Interrupted` with a migration intent, then becomes `Migrated` only after the
conversion and validation commit. An incomplete or failed migration remains
`Interrupted` if its checkpoint is trustworthy, otherwise it becomes
`Damaged`. Any invalid record becomes `Damaged`. `Damaged` has no automatic
transition out. A repair, if later designed, must be a separately versioned,
auditable migration. These are logical transitions; their persistence and
interruption behavior are runtime gates.

The logical record contains schema version, lifecycle and lifecycle reason,
current progression state, transition sequence, schedule generation/key and
target, current arc/stage, active Situation/Project reference when applicable,
pause reason and resume policy, plus a bounded idempotency ledger. These are
logical fields, not proposed Stellaris variables or commands. Concrete storage
and write ordering require runtime verification.

### Bounded, typed idempotency ledger

Use distinct key namespaces and completion markers for **transition**,
**presentation**, **object creation**, and **effect** operations. A key is
derived from schema version, empire record identity, stage sequence, operation
class, and a content-defined operation ordinal. Reusing a transition key as an
effect key is invalid. Each operation records `pending` before attempting work
and `committed` only after its result is confirmed; an interrupted `pending`
entry is not treated as complete and may only retry through the same key and
operation-specific recovery rule.

The ledger is bounded by a schema-declared maximum sized from the planned
maximum operations in one active stage. Keep active-stage keys only; once a
stage commits, compact its result into a fixed-size stage checkpoint and reject
callbacks carrying older stage sequences. If a future design requires
out-of-order callbacks or more retained history than the checkpoint represents,
it must revise this policy before implementation. At capacity, fail closed:
pause with a `ledger_full` diagnostic; never evict an unproven key or silently
replay work. The exact bound, stable key representation, persistence, atomicity
of pending/committed writes, and ability to distinguish an interrupted effect
from an unexecuted effect are **RUNTIME GATES**. Do not implement rewards or
object creation until those gates pass.

| State | Entry conditions | Allowed next states | Trigger and guard | Persistent information | Abort and recovery |
|---|---|---|---|---|---|
| **Not scheduled** | No active schedule in a valid Initialized or Migrated record. Absence of a record is not this state. | Scheduled; Paused / Invalidated | Country-start bootstrap or explicit one-shot migration; shared eligibility must pass and bootstrap guard must be clear. | Schema, record lifecycle, state, transition sequence, eligibility result/reason. | Ineligible countries remain outside progression or record an ineligible reason. A duplicate dispatch is a no-op. |
| **Scheduled** | Eligibility passed; generation/key/target and unconfirmed registration intent persisted before requesting a delayed callback. | Discovered; Paused / Invalidated | Callback arrives with current schedule generation, record remains Scheduled, eligibility passes, no conflicting instance exists. | Schedule key/generation, target/order, registration status/retry count, state version. | On uncertain registration, use only the bounded one-shot same-key retry described above after its runtime gate; otherwise pause. |
| **Discovered** | Valid scheduled callback passes all checks and commits discovery operation key. | Investigating; Paused / Invalidated | Discovery event outcome or automatic transition when investigation object is successfully created. | Discovery operation key, arc/stage, discovery date/sequence, active object reference if created. | If presentation completion is uncertain, keep its typed ledger entry pending and pause unless safe replay has been verified. Eligibility loss pauses. |
| **Investigating** | Investigation begins and required Situation or other progression object is confirmed active. | Resolved; Paused / Invalidated | Explicit success/completion callback for the active stage, with matching object and operation key. | Active stage, object identity/reference, choice/approach outcome, callbacks already consumed. | Abort/failure/invalid owner pauses with reason. Resume same stage only after object and gate are revalidated; otherwise invalidate explicitly. |
| **Resolved** | Current investigation's success/failure choice is committed and its completion key recorded. | Investigating; Completed; Paused / Invalidated | A later arc becomes eligible and is explicitly started; final UAP completion criterion is met; or a required gate fails. | Resolution key, selected outcome, consequences applied keys, next-stage eligibility. | Replayed resolution callback is a no-op. Retry only a separately keyed, designed continuation; never reapply consequences. |
| **Paused / Invalidated** | A gate, object, schema, or owner became invalid, or an explicit cancellation/recovery policy paused progression. Includes reason and resumability classification. | Scheduled; Discovered; Investigating; Resolved; Completed (policy-specific only) | Explicit resume/revalidation event or administrative migration; must match pause reason and current state version. | Pause reason, prior state, resumable/permanent flag, retry count/bounded policy, failed operation key. | No polling. Permanent invalidation cannot resume. Resume restores prior valid stage or a specifically defined safe checkpoint; no reward replay. |
| **Completed** | The designed UAP terminal criterion is met and the completion operation key is committed. | None (terminal) | Explicit final completion callback with all required prerequisites and matching active stage. | Completion key/date, terminal outcome/version, applied final-effect keys. | Any duplicate callback is a no-op. Corrections require an explicit versioned migration, not a normal transition. |

### Transition rules

- Every transition names its expected prior state, expected schema version,
  transition sequence, and unique transition key. A mismatch means no-op or
  quarantine, never force-advance.
- Presentation, object creation, and each effect have separate operation keys
  and completion records. Do not consider presentation complete because a
  transition committed, object creation complete because it was requested, or
  an effect complete because its event ran.
- The protocol of writing `pending`, performing the operation, and writing
  `committed` is a design contract, not an atomicity guarantee. If execution can
  stop after the operation but before its commit marker, retry could repeat an
  effect. Until runtime tests establish a safe recovery pattern for that
  operation class, keep it paused for diagnosis instead of retrying it.
- `Resolved` is an intermediate result, not necessarily terminal. It may start
  a later investigation or move to `Completed` only when the full UAP terminal
  condition is met.
- Pausing is explicit, reasoned, and non-polling. Temporary pauses have a named
  revalidation trigger. Permanent invalidation has no resume path.
- No transition is keyed solely on an event firing. Require matching empire,
  current state, current object, and a not-yet-consumed operation key.

## Modules and interfaces

| Module | Owns | Consumes / publishes | Must not own |
|---|---|---|---|
| **Bootstrap / Initialization** | Country-start entry, duplicate guard, schema initialization, initial scheduling request. | Consumes country context; calls Eligibility and State Management. | Story/event content, class-specific story logic, global polling. |
| **Eligibility** | One pure, shared empire gate and stable reason categories. | Input: country facts + campaign gate; output: eligible/reason. | State mutation, scheduling, player/AI differentiation. |
| **UAP State Management** | Record lifecycle classification; state schema, transition validation, typed bounded operation ledger, migration/quarantine policy. | Input: expected lifecycle/state/version + typed operation key; output: accepted/rejected operation and checkpoint. | Narrative presentation, situation internals, compatibility content. |
| **Discovery Scheduling** | Target ordering/delay policy, persisted unconfirmed intent, and bounded same-key recovery request. | Input: stable empire key + schedule generation; requests delivery callback. | Eligibility policy duplication, story outcomes, unbounded retries, random mechanism before MP validation. |
| **Event Orchestration** | Connects validated transitions to event presentation and downstream callbacks. | Consumes accepted transitions; calls Situation/Project adapters and state transitions. | Owning persistent progression state independently; hidden global scans. |
| **Situation Management** | Adapter for starting, identifying, observing completion/abort of an active investigation situation. | Input/output through country-scoped orchestration contracts. | Core UAP state machine, schedule policy, Gigastructures references. |
| **Special Project Integration** | Adapter for discrete research tasks and success/failure callbacks. | Input: project request/context; output: keyed result callback. | Persistent duplicate UAP state, independent eligibility rules. |
| **AI Decision Handling** | Safe automatic outcome or verified AI weights for blocking choices. | Same state/gates/costs as player choices; reports choice via ordinary event contract. | Special AI eligibility, client-specific state, bypassed prerequisites. |
| **Localisation / UI** | Player-readable names, descriptions, status, errors, and accessible choices. | Reads state/reason keys through stable UI contract. | State transitions or gameplay logic. English and German required. |
| **Optional Compatibility Integration** | Gigastructures-specific mapping, content detection/offer, and compatibility-only UI/events. | Calls documented Core extension points; absent integration means Core path is unchanged. | Core bootstrap ownership or mandatory Core state/content references. |

Interfaces are conceptual contracts, not literal script APIs. Keep one-way
dependencies: Bootstrap → Eligibility and State; Scheduling → State callback;
Orchestration → State + Situation/Project adapters; adapters return outcomes
through Orchestration; AI and UI consume the same state/event contracts. No
module enumerates all empires as part of routine progression.

## Multiplayer, performance, and observability

### Required architecture rules

- All scheduling decisions, eligibility outcomes, transition writes, and
  operation keys are produced by synchronized game-side events in the owning
  country context. Do not branch on client identity or maintain client-local
  gameplay variables.
- Prefer stable deterministic staggering derived from saved/synchronized inputs
  or a synchronized random source whose behavior is proven. Do not use a
  client-local random draw, wall clock, UI open state, or player-only callback.
- At game start, work is bounded by one hook dispatch per country and at most
  one schedule request for each eligible country. Subsequent work is one
  callback per scheduled transition and callbacks from active gameplay objects.
- No routine daily/monthly global or per-country polling. Situation-native
  progress may have engine-managed periodic work; measure the cost for active
  instances rather than adding an EPOCH scanner.
- Bound schedule creation and event fan-out. Discovery callbacks should contain
  only a compact key and revalidate at delivery; never queue duplicate callbacks
  for the same generation.
- Every state needed to resume must be persisted at empire scope and referenced
  objects must be revalidated after load. Save/load is a first-class transition
  test, not an assumption.
- Diagnostics are keyed, bounded, and inspectable. Include transition sequence,
  prior/next state, operation key, and rejection reason. No unbounded log loop.

### Open validation points

The following remain **UNVERIFIED** and block implementation claims: additive
on_action registration; exactly-once hook coverage; synchronized delay/random
semantics; event ordering and re-entrancy; persistence of country flags,
variables, queued events, situation/project references; callback retry and
deduplication semantics; bounded ledger persistence and pending/commit write
ordering; detection and recovery of Interrupted versus Damaged records;
state/effect atomicity;
host/client desync behavior; AI progression; actual event/situation costs; and
recovery behavior on country removal. Validate on the requested 4.5.3 runtime
with parser logs, fresh saves, pre/post callback save-load checkpoints, all
supported empire classes, player and AI, duplicate-path probes, large empire
counts, and a host/client session. Record per-case results without changing the
historical M0-B/M0-C reports.

## Gigastructures boundary

EPOCH Core may define generic progression extension points but cannot name,
require, or assume any Gigastructures identifier, event, situation, project,
megastructure, technology, component, or localisation key. The optional
Gigastructures compatibility mod owns those mappings and its own dependency
metadata. It may depend on Core and Gigastructures only after package layout,
descriptor syntax, activation, and load order are verified. If it is absent or
disabled, Core must retain its full non-Gigastructures path. M0-B did not verify
launcher/package behavior; this separation is an architectural requirement.

## Implementation and runtime gates

M0-D authorizes documentation only. Before gameplay implementation, validate:

1. Hook merge/addition and country coverage without disrupting Vanilla handlers.
2. Eligibility truth table for regular organic, Hive, machine, player, AI, and
   excluded country roles.
3. Single scheduling, deterministic stagger, callback revalidation, duplicate
   delivery, and bounded event creation.
4. Save/load before and after delivery, during active Situation/Project, and
   during schema migration; test existing campaign entry separately.
5. State transition interruption and replay at each one-time effect boundary.
6. Multiplayer host/client parity and desync checks for schedule and each
   transition path.
7. Performance at representative galaxy/empire sizes and active object counts.
8. Core-only load and independently activated optional compatibility package.

Use the existing M0-B/M0-C records as historical evidence; append new results
to a new record instead of rewriting those results. No gameplay files are
changed by this phase.
