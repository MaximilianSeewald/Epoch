# Stage II – Resonance

**Status: Binding design specification.** Exactly five chapters. Gameplay is not implemented by this document. Detailed technical constraints are in the [technical contract](../technical-contract.md), legacy code decisions in the [migration matrix](../architecture/content-migration.md), and acceptance criteria in [testing](../testing.md).

## Entry and continuity

About five in-game years after an empire chooses to continue at the end of Stage I, its investigation resumes with the old signal. The interval is measured from that decision, not game start. Small timing variation may stagger eligible empires. No Stage-II project, active situation, chapter, or dispatch begins before this interval expires. A permanent Stage-I exit blocks entry.

Preserve Stage-I decisions and actual outcomes, including the contamination world/state, Silent Structure result, conclusion assessment, capital scar, and durable effects. Features remain attached to their actual planets and retain their economic consequences. If a world or object is unavailable, use a documented archive, remote observation, or paid fallback; do not relocate consequences to unrelated worlds. Each empire owns its own record, projects, objects, and progress.

Stage II links the scar and distant systems through an unexplained signal, establishes the Nullwardens' involvement in suppression, and resolves the immediate investigation. It does not reveal the origin or full purpose of the network, conclude with the Resonance Chamber or Countermark, or reveal UAP.

## Five chapters

### 1. The Scar Wakes

The old signal returns. Investigate through a real Science Ship project with a valid target, scientific participation, and durable result, or a clear paid alternative when that route is unavailable. Stage-I outcomes change risk, knowledge, and economic effects. Time alone does not complete the chapter.

### 2. The First Hunters

Encounter an actual hostile Nullwarden fleet in a visible star system. It exists as a real military object and Stellaris processes it through normal fleet/combat systems. Military victory, active diversion, prepared defense, and costly withdrawal can all produce valid outcomes. Record the actual result durably. A popup or elapsed time alone cannot complete the chapter.

### 3. The Broken Code

Analyze wreckage, sensor traces, or replacement archives through real research projects with valid targets and science participation. Start useful research paths without granting technologies automatically. Losing the primary target changes the route or reward, not access to completion.

### 4. The Second Infection

Build a **genuine interactive planetary containment mini-game** that responds to actual planetary conditions and the shared Feature states. The player observes the planet's current state, chooses and carries out containment actions, receives mechanical feedback, and faces follow-up consequences. It cannot be a sequence of event popups or an abstract progress counter. Quarantine, research, exploitation, and failure differ mechanically and affect the planet's economy, stability, and existing Feature state immediately. Failure may leave a permanent consequence but must retain an actionable recovery route. The precise player interface and action mechanics are open for the implementation design; the interactive planet-level gameplay requirement is settled.

### 5. The Network of Silence

Explore multiple actual star systems using concrete marked targets and real Science Ship projects. Branch decisions about silent systems, suppressed signals, and the network reflect earlier choices and change findings and risks. End Stage II with a meaningful record and narrative transition into Stage III. Chapter 5 is the end: there is no sixth chapter or later Stage-II finale/ending choice.

## Shared requirements and open implementation details

Use real game objects, player actions, and durable results. Calendar time may pace opportunities but cannot replace objectives. Define valid project targets, science requirements, costs, callbacks, cancellation behavior, and missing-object fallbacks. Chapter 2 fleet scale, precise project/economy values, campaign-record schema, Chapter 4 interface/actions, and Chapter 5 target marking and handoff fields require implementation design and testing. Do not inherit old thresholds, flags, event cadence, Chamber activation, or Countermark outcomes as requirements.
