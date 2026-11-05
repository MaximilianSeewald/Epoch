# EPOCH discovery framework

**Status:** design proposal for M0-A. No gameplay scripts are implemented here.
Engine details are proposals until verified against Stellaris 4.5.3.

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

### A. One-time bootstrap with per-empire delayed events — recommended proposal

**Trigger mechanism:** A verified game-start hook invokes one bootstrap handler.
It enumerates eligible empires once and schedules an empire-scoped discovery
event. Each scheduled event rechecks eligibility before changing state. The exact
4.5.3 hook, iteration, delayed-event mechanism, and scope behavior remain
unverified.

**Randomisation/staggering:** Select a delay from a bounded early-game interval
per empire, optionally with a deterministic empire-specific offset. Use only a
verified synchronized random mechanism; otherwise use deterministic ordering and
fixed spacing. Do not use local clock or client-only randomness. Exact functions
and guarantees require verification.

**Eligibility:** Apply a shared gate to organic, Hive Mind, and Machine
Intelligence empires. Exclude already-started empires and invalid game states.
Use the same gate for human and AI. Concrete trigger syntax and empire-class
checks are unverified.

**AI handling:** AI receives the same scheduled event and state transitions. Its
choices use verified AI weights or safe automatic outcomes. Availability and
semantics require 4.5.3 verification.

**Multiplayer:** A synchronized game event and saved empire state are intended to
make all clients see the same schedule and outcomes. This must be proven in
multiplayer; event scheduling cannot be assumed safe without a desync test.

**Performance:** One global pass at startup, then one delayed callback per
eligible empire and event-driven progression. Work scales with the number of
empires once rather than repeated global polling. Actual engine cost is unmeasured.

**Advantages:** Clear per-empire schedule; no persistent polling; consistent
eligibility; visibly staggered timing.

**Disadvantages:** Depends on a verified bootstrap hook and safe scheduler. Large
schedule creation may need load testing; save/load and client synchronization
need validation.

### B. Repeated low-frequency eligibility pulse

**Trigger mechanism:** A periodic global event checks empires and starts discovery
when eligibility and timing gates pass. It stops or becomes inert after the
discovery window. This is a fallback proposal; periodic hooks, iteration, and
trigger support are unverified.

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

Investigate approach A first. This is an EPOCH design decision, not a verified
statement about engine support. If 4.5.3 lacks a suitable safe bootstrap or
per-empire scheduler, revisit the design before implementation; approach B is a
constrained fallback, not permission for frequent polling. Do not write
speculative script syntax as though it were executable.

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
