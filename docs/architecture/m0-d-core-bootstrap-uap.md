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
3. **Duplicate guard:** if a durable bootstrap marker or any UAP state already
   exists, return without scheduling. A state record and its guard must be
   written before queuing the delayed callback, so a repeat dispatch cannot
   enqueue a second callback.
4. **Eligibility:** invoke the single shared eligibility policy. It treats
   organics, Hive Minds, and Machine Intelligences as supported classes and
   does not branch on human versus AI control. Eligibility outcomes carry a
   stable reason code for diagnostics.
5. **Schedule:** for an eligible empire, persist `Scheduled`, the schedule
   generation/key, and a bounded target time/order, then queue at most one
   delayed callback. The exact delay mechanism and per-empire staggering method
   remain subject to parser and multiplayer validation. A fixed, deterministic
   offset is the first candidate; do not assume a random-delay form is safe.
6. **Delivery:** the callback verifies its generation/key is still current,
   confirms state is still `Scheduled`, and re-runs the same eligibility rule.
   If all checks pass, it transitions to `Discovered` and emits the first
   discovery presentation once. If a check fails, it transitions to
   `Paused / Invalidated` with a reason and no progression side effects.

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
- A callback after load follows the same key, state, and eligibility checks as
  any other delivery. If it is missing, the architecture must not silently
  infer whether it was consumed. Recovery may requeue only when a verified
  reconciliation path can establish that the schedule is still pending and
  safely deduplicate the old callback.
- Do not use the single-player save-load hook as a recovery mechanism; M0-B
  source explicitly warns that it does not run on MP save loads due to OOS
  concerns.
- Existing campaigns created before EPOCH is enabled are **not implicitly
  initialized by this design**. First release behavior is opt-in migration:
  provide a deliberate one-shot migration entry point only after a synchronized
  4.5.3-safe invocation path is verified. It calls the same duplicate guard and
  eligibility policy. Until then, document that existing campaigns are not
  supported for bootstrap. Never compensate with a recurring global scan.
- A save containing an older EPOCH state version is reconciled through a
  versioned migration map. Unknown or corrupt versions are quarantined as
  `Paused / Invalidated` with a diagnostic reason; never reset them to
  `Not scheduled` and risk replaying rewards.

### Error and recovery policy

| Condition | Required handling |
|---|---|
| Duplicate hook or callback | No-op using state plus operation key; record a diagnostic counter/reason only if that is safe and bounded. |
| Eligibility lost before delivery | Mark paused/invalidated with reason; do not emit discovery or grant effects. |
| Delayed callback key is stale | No-op; do not change newer state. |
| Unsupported/corrupt saved schema | Quarantine; preserve original data where possible and log state version/reason. |
| Missing downstream Situation/Project definition | Keep progression recoverable and paused with the missing integration identifier; do not mark success. Exact engine-safe detection needs validation. |
| Callback or event is delivered twice | Transition guard and one-time operation key prevent duplicate presentation, rewards, or object creation. |
| Permanent loss/removal of country | Mark terminal invalidation if country scope is still addressable; otherwise rely on engine cleanup and treat cleanup semantics as an open test. |
| Unexpected event failure | Keep the last committed state and operation key; recovery is an explicit, guarded retry or operator-readable diagnosis, never implicit replay of completed effects. |

Error logging must be concise and bounded: empire identity, UAP schema/state,
operation key, event/transition name, reason code, and game version where
available. Do not write per-tick logs.

## UAP empire state machine

State is empire-specific. The state record contains: schema version; current
state; monotonically increasing transition sequence; schedule generation/key
and target; current arc/stage identifier; active Situation/Project reference
when applicable; pause reason and resume policy; and a set/ledger of completed
one-time operation keys. These are logical fields, not proposed Stellaris
variables or commands. Choose concrete storage only after its scope, save/load,
and multiplayer behavior are verified.

| State | Entry conditions | Allowed next states | Trigger and guard | Persistent information | Abort and recovery |
|---|---|---|---|---|---|
| **Not scheduled** | No UAP record exists, or a deliberately migrated eligible legacy record is initialized to this state. | Scheduled; Paused / Invalidated | Country-start bootstrap or explicit one-shot migration; shared eligibility must pass and bootstrap guard must be clear. | Schema, state, transition sequence, eligibility result/reason. | Ineligible countries remain outside progression or record an ineligible reason. A duplicate dispatch is a no-op. |
| **Scheduled** | Eligibility passed; schedule key/target persisted before a single delayed callback is queued. | Discovered; Paused / Invalidated | Callback arrives with current schedule generation, record remains Scheduled, eligibility passes, no conflicting instance exists. | Schedule key/generation, target/order, queued-once marker, state version. | Cancel/expire only via a guarded terminal invalidation. Load recovery checks key; it does not blindly queue again. |
| **Discovered** | Valid scheduled callback passes all checks and commits discovery operation key. | Investigating; Paused / Invalidated | Discovery event outcome or automatic transition when investigation object is successfully created. | Discovery operation key, arc/stage, discovery date/sequence, active object reference if created. | If presentation fails, retain state and allow idempotent presentation retry; do not duplicate event/reward. Eligibility loss pauses. |
| **Investigating** | Investigation begins and required Situation or other progression object is confirmed active. | Resolved; Paused / Invalidated | Explicit success/completion callback for the active stage, with matching object and operation key. | Active stage, object identity/reference, choice/approach outcome, callbacks already consumed. | Abort/failure/invalid owner pauses with reason. Resume same stage only after object and gate are revalidated; otherwise invalidate explicitly. |
| **Resolved** | Current investigation's success/failure choice is committed and its completion key recorded. | Investigating; Completed; Paused / Invalidated | A later arc becomes eligible and is explicitly started; final UAP completion criterion is met; or a required gate fails. | Resolution key, selected outcome, consequences applied keys, next-stage eligibility. | Replayed resolution callback is a no-op. Retry only a separately keyed, designed continuation; never reapply consequences. |
| **Paused / Invalidated** | A gate, object, schema, or owner became invalid, or an explicit cancellation/recovery policy paused progression. Includes reason and resumability classification. | Scheduled; Discovered; Investigating; Resolved; Completed (policy-specific only) | Explicit resume/revalidation event or administrative migration; must match pause reason and current state version. | Pause reason, prior state, resumable/permanent flag, retry count/bounded policy, failed operation key. | No polling. Permanent invalidation cannot resume. Resume restores prior valid stage or a specifically defined safe checkpoint; no reward replay. |
| **Completed** | The designed UAP terminal criterion is met and the completion operation key is committed. | None (terminal) | Explicit final completion callback with all required prerequisites and matching active stage. | Completion key/date, terminal outcome/version, applied final-effect keys. | Any duplicate callback is a no-op. Corrections require an explicit versioned migration, not a normal transition. |

### Transition rules

- Every transition names its expected prior state, expected schema version,
  transition sequence, and unique operation key. A mismatch means no-op or
  quarantine, never force-advance.
- Commit state and the one-time key before emitting presentation or applying
  non-repeatable effects where engine semantics permit. Since script-level
  atomicity is **UNVERIFIED**, split object creation/effect application into
  separately guarded operations and test interruption at each boundary.
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
| **UAP State Management** | State schema, transition validation, operation-key idempotency, migration/quarantine policy. | Input: expected state/version + operation; output: accepted/rejected transition. | Narrative presentation, situation internals, compatibility content. |
| **Discovery Scheduling** | Target ordering/delay policy and one callback request per eligible empire. | Input: stable empire key + schedule generation; emits delivery callback. | Eligibility policy duplication, story outcomes, random mechanism before MP validation. |
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
variables, queued events, situation/project references; state/effect atomicity;
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
