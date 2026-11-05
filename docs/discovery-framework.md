# EPOCH discovery framework

**Status:** EPOCH design proposal informed by M0-B source inspection. No gameplay
scripts are implemented here. See the [evidence matrix](evidence/m0-b-engine-verification.md)
for the source/runtime boundary.

## Requirements

- Discovery begins through events, not technology.
- Add no starting civics, traits, origins, or bonuses.
- Organic empires, Hive Minds, and Machine Intelligences follow the same entry rules.
- Each eligible empire is scheduled separately in a shared early-game window, so
  discoveries feel broadly contemporaneous without occurring simultaneously.
- Player and AI use the same eligibility and progression gates.
- Avoid recurring daily/monthly galaxy-wide polling.
- Multiplayer outcomes and randomisation must be synchronized and deterministic.
- The first incidents create a consequential but manageable challenge.
- Early narrative does not identify the final ascension or explain its full purpose.

## Candidate approaches

### A. Per-country start hook with country-local delayed event — recommended

**Recommended sequence:** use the source-defined `on_game_start_country` hook
to evaluate each country in its own context, filter to suitable player/AI
empires, set an idempotency marker, and schedule that country's delayed
discovery event. The callback rechecks eligibility and state before advancing.
This avoids both a separate global bootstrap enumeration and recurring global
polling. Source examples support the hook and delayed country events; runtime
exactly-once and save/load behavior remain unverified.

**Trigger mechanism:** `common/on_actions/00_on_actions.txt` defines
`on_game_start_country` separately from global `on_game_start`; the country hook
lists country-start events. The vanilla definition alone does not verify how a
mod adds a handler without replacing vanilla entries. Confirm additive merge
behavior in an isolated mod first. If supported, use a country-scoped event
handler with a guard. The source supports delayed `country_event` calls with
`days`; randomized delay is subject to parser and MP validation. The source
matrix records precise anchors.

**Randomisation/staggering:** Assign a bounded delay independently for each
country only after verifying the random mechanism and MP behavior. Source has
examples of delayed events, but this inspection does not verify random-delay
syntax or its synchronization guarantees. Until tested, use fixed timing and
accept weaker stagger, or hold implementation.

**Eligibility:** Apply a shared gate to organic, Hive Mind, and Machine
Intelligence empires and exclude invalid country types. Apply the same gate for
human and AI. The hook's per-country dispatch is source-visible, but exact
coverage and suitable eligibility predicates still need runtime validation.

**AI handling:** AI receives the same scheduled event and state transitions. Its
choices use verified AI weights or safe automatic outcomes. Availability and
semantics require 4.5.3 verification.

**Multiplayer:** A synchronized game event and saved empire state are intended to
make all clients see the same schedule and outcomes. This must be proven in
multiplayer; event scheduling cannot be assumed safe without a desync test.

**Performance:** One hook dispatch per country at game start, then at most one
delayed callback per eligible empire and event-driven progression. This avoids
repeated global enumeration by design; actual engine cost is unmeasured.

**Advantages:** Country-local eligibility, no explicit all-empire scan, no
persistent polling, and a natural place for individual scheduling.

**Disadvantages:** Hook coverage, exact-once behavior, safe scheduler, save/load,
and client synchronization need validation. Large schedule creation may need
load testing.

### B. Repeated low-frequency eligibility pulse

**Trigger mechanism:** A periodic global event checks empires and starts discovery
when eligibility and timing gates pass. It stops or becomes inert after the
discovery window. Vanilla has pulse hooks, but their use for EPOCH is a fallback;
periodic global scanning adds avoidable work.

**Randomisation/staggering:** Assign or derive a per-empire target date; a coarse
pulse starts discovery when due. Per-empire target state and deterministic
generation require verification.

**Eligibility:** Same shared gate and same three empire classes as approach A;
the check repeats until started or the window expires.

**AI handling:** Same gates and state as players. AI-specific choices require
verified AI support.

**Multiplayer:** Repeated synchronized events may be deterministic if supported,
but recurring execution creates more opportunities for divergent condition
timing. Multiplayer testing is required.

**Performance:** Repeated global/country enumeration can waste work. Limiting
duration and frequency reduces cost but does not remove repeated work; no cost
claim is verified.

**Advantages:** Less reliance on pre-scheduling delayed events; can recover from
a missed or newly eligible empire during the active window.

**Disadvantages:** Adds recurring work, complicates cutoff behavior, and risks
violating the no-unnecessary-polling requirement. Use only if 4.5.3 cannot safely
support approach A.

## Recommendation and verification boundary

Investigate approach A first. The hook and day-delayed event patterns are
VERIFIED – SOURCE in the supplied reference, but their behavior is not VERIFIED –
RUNTIME. If testing shows incomplete country coverage, unsafe scheduling, or MP
issues, revisit the design; approach B is a constrained fallback, not permission
for frequent polling. Do not write speculative script syntax as though it were
executable.

## Proposed state model

State is per empire. These labels are conceptual, not Stellaris script identifiers.

| State | Meaning | Transition |
|---|---|---|
| `not_scheduled` | No discovery schedule exists. | Initial state; eligible empire enters `scheduled`. |
| `scheduled` | A discovery time or ordering has been assigned. | At callback, recheck the shared gate; enter `discovered` or expire safely. |
| `discovered` | First signal has been presented; final ascension remains unrevealed. | First discovery event. |
| `investigating` | An initial challenge or investigation is active. | Player/AI follows the same progression gate. |
| `resolved` | Initial incident outcome and consequence are recorded. | Resolution event; later arcs may become eligible. |
| `paused_or_invalidated` | A required gate no longer holds or progression cannot continue. | Explicit recovery/expiry; never silently strand the chain. |

Transitions should be idempotent so replayed callbacks cannot duplicate discovery
or rewards. Persist state on the empire using a 4.5.3-verified mechanism. Storage,
event-target lifetime, and save/load semantics remain unverified. Later stages
advance through explicit outcomes rather than a permanent global monitor.

## Challenge pacing

The first incident should ask for a limited response, such as a temporary research,
resource, or attention cost, and offer a meaningful choice. It should not create an
unbounded crisis, demand immediate war, or grant a major permanent bonus. AI must
reach a safe outcome through the same prerequisites. Exact costs/rewards belong to
later content design and are outside this documentation task.
