# EPOCH Phase I: First Contact

**Status:** Binding campaign specification; implementation remains in progress.
**Target:** Stellaris PC 4.5.3. **Scope:** one independent First Contact campaign per participating organic, Hive Mind, or Machine Intelligence empire.

> PR #6 is the technical starting point for Phase I, but it is not the complete Phase I implementation. Its First Echo and Missing Expedition prototype do not complete this specification.

This document is the source of truth for Phase I. It expands the six-phase story framework in [the architecture overview](../architecture.md), uses the state and bootstrap constraints in [M0-D](../architecture/m0-d-core-bootstrap-uap.md), and supersedes the narrower M2/M3 scope in [the roadmap](../roadmap.md). The current technical evidence and its limits are in [the 4.5.3 evidence matrix](../evidence/m0-b-engine-verification.md); the regression suite is described in [testing](../testing.md).

## Goal and boundary

Phase I is a complete, individually owned, reliably finishable campaign with five connected sections. It introduces a local mystery, records durable choices, creates gameplay consequences, and ends with a choice to proceed to Phase II or permanently leave the active EPOCH campaign. It must not disclose the final purpose of EPOCH or implement Phase II.

Phase II may be prepared through clues, unlocks, and a continuation state. Its campaign content, complete lore reveal, and later phase systems are out of scope. Vanilla content remains intact; no new origin, civic, trait, starting bonus, or resource is introduced. Gigastructures remains optional.

Phase I must leave each participating empire with at least one permanent, gameplay-relevant negative consequence. That cost must emerge from its actual campaign path and be proportionate; it must not be a temporary modifier that expires or is cleared by ordinary play. Organic empires, hive minds, and machines may suffer different persistent effects. The gameplay state may reveal more damage than the empire can explain. Consequence text must not restate visible modifier arithmetic.

The closing decision is always expressed as an in-world act, such as sealing the records, abandoning the site, or ordering that investigation cease. Never expose mod, campaign, phase-participation, or opt-out terminology in player-facing localization. The internal permanent opt-out still suppresses every active EPOCH object and dispatch for that empire.

## Campaign sections

| Section | Purpose and required play |
|---|---|
| 1. First Echo | Discovery follows actual science-ship exploration and is staggered per empire. Each empire owns its situation, projects, target system, choices, and outcomes. At least two approaches impose meaningfully different time/risk/cost and alter later paths. The mystery remains unresolved. |
| 2. Missing Expedition | A campaign-owned expedition vessel and crew/leader are tied to a known owner, origin, and mission destination. The disappearance must alter the ship object (loss, removal, or another observable state change). A player-owned pre-existing ship must never be removed. Search uses projects and/or other native mechanics. Rescue, recovery, survey, and abandonment must yield conditional, non-guaranteed outcomes, including loss. First Echo choices alter available routes, cost, or risk. |
| 3. First Contamination | One concrete owned planet/facility/object receives a native, gameplay-affecting state. Organics, hive minds, and machines receive thematic variants within the same stage. Investigation and containment are actionable; neglect can worsen or spread the effect. Prior Echo and expedition outcomes affect severity, options, and cost. |
| 4. The Silent Structure | Earlier clues resolve into an owned/located structure or equivalent world object with a common but unexplained signature. Investigation, securing, and destruction are distinct actions with durable, different results. Contamination and prior choices affect access and consequences. |
| 5. Phase I Conclusion | An uncertain closing assessment reflects the actual outcomes of sections 1–4 and prepares (but does not implement) Phase II. The player chooses continuation or an in-world act that internally means permanent exit. Exit blocks all later EPOCH events, situations, projects, invitations, and automatic re-entry for that empire. Existing consequences, including at least one permanent negative gameplay effect, persist; galaxy-wide effects caused by other empires may still be observed indirectly. |

## Persistent campaign logic

The canonical owner is the country. Campaign phase, decision/outcome flags or variables, opt-out state, and all owned active objects must be saved and isolated by owner. Every transition has a guarded entry condition and idempotent effect. Each section records an explicit outcome, including failure, unavailable-object recovery, refusal, or abandonment, so no empire becomes stuck waiting for a missing target.

Required links include: Echo approach -> expedition risk/options; expedition result -> contamination presentation/severity; contamination state -> structure access/options; structure resolution -> conclusion; all four results -> conclusion summary and continuation/exit. Not every individual choice needs to affect every later section, but each link must be observable and documented in the scripts and regression coverage.

All active campaign dispatches re-check eligibility, owner, current section, and permanent opt-out. Never retrieve one empire's ship, planet, situation, project, or event target while handling another empire. Prefer owner-scoped persistent state and owner-keyed targets; global named targets without an owner key are prohibited for campaign objects. Missing systems, planets, ships, leaders, situations, or targets must resolve to a safe fallback that advances or closes the relevant stage without deleting unrelated objects. The final negative consequence must be durably represented by saved game state; its persistence must be verified across save/load.

## Native gameplay and AI

Use Stellaris ship/fleet/leader, actual movement/exploration, special project, situation, planet modifier, resource/research, technology, building/job, and object destruction/recovery mechanics where they fit. Events present story, decisions, and transitions; they do not stand in for a promised ship, contamination, structure, or economic effect. Avoid unnecessary global daily/monthly sweeps. A situation's own supported progress callbacks are acceptable where a long-running process needs them.

Every blocking player decision has an AI-safe route using the same prerequisites and costs as the human route. AI must reach all five conclusions, handle missing objects, and make a defensible continuation/exit choice without start bonuses or special eligibility. AI weights must not leave an empire indefinitely stuck. Hive Minds and Machine Intelligences use the same campaign progression with class-appropriate text and mechanics.

## Vanilla evidence and verification rules

**Implementation snapshot:** `epoch_core_events.txt` now contains the five-stage
progression draft; `epoch_core_effects.txt` and `epoch_core_designs.txt` add the
dedicated expedition ship, scientist, and route; special projects and static
modifiers supply investigation and persistent planet consequences. This is an
implementation draft, not a Phase I completion claim. The full ship lifecycle,
object-target callback scopes, AI project automation, save/load, multiplayer,
and in-game behavior remain subject to the verification gates below.

The supplied M0-B source subset identifies `on_survey_planet` as **Ship scope** with **From = Planet** (`common/on_actions/00_on_actions.txt`, around lines 1129–1137). This does not establish `root.owner`, `solar_system`, or any other transition as valid. `on_planet_surveyed` instead documents Root = Planet, From = Country, and FromFrom = surveying fleet if present; it can fire without a ship through intel. Therefore discovery requiring an actual science ship must use the ship-scoped survey hook and explicitly test its legal scope transitions.

The curated M0-B subset contains examples of `create_fleet`, nested `create_ship`, `create_leader`, and `enable_special_project`. The installed 4.5.3 source adds concrete ship-design examples (`common/global_ship_designs/event_ship_designs_anomalies.txt`), ship creation at `events/anomaly_events_1.txt` around event 211, scientist creation at `events/anomaly_events_1.txt` around line 2465, and ship destruction examples in `common/scripted_effects/02_machine_age_effects.txt`. These establish source patterns for design, creation, and destruction; they do not establish that a new EPOCH vessel can complete its whole assignment and recovery path in runtime. Record exact source examples and test the created vessel end-to-end before marking this requirement done.

Special-project definitions and situation callbacks are source-supported patterns, not proof of EPOCH parser or runtime behavior. Verify project prerequisites, cost/duration semantics, callback scopes, situation scope transitions, save/load, missing-object behavior, event-target ownership, and `save_global_event_target_as` owner-key syntax against the target build and runtime. No unsupported scope assumption is accepted as verified.

Record status as `VERIFIED – SOURCE`, `VERIFIED – RUNTIME`, `PROPOSED`, or `UNVERIFIED`; never describe static assertions as proof of in-game behavior. If a native mechanism cannot be made reliable, document the tested limitation and use a technically viable gameplay substitute with equivalent observable results.

## Technical and gameplay completion criteria

Phase I is complete only when all are true:

1. This binding specification and linked architecture docs match the shipped implementation.
2. All five sections are playable, connected, and finishable, including failure and absent-object paths.
3. The expedition is a real empire-owned created ship/team with a verified lifecycle; its disappearance changes the world object; rescue, loss, and recovery can differ and are not guaranteed.
4. Contamination changes a real game object and relevant gameplay values; investigation, containment, worsening, and spread have consequential outcomes.
5. The Silent Structure is a concrete find; investigation, control, and destruction change persistent game state and later outcomes.
6. Prior decisions/results flow into later sections and the final assessment.
7. The conclusion supports continuation and irreversible opt-out, with every opt-out path suppressing re-enrollment and active content.
8. Organic, Hive Mind, Machine Intelligence, player, AI, multiple simultaneous empires, save/load, and multiplayer behavior are covered. No inter-empire target leakage is present.
9. English/German localisations are complete and key sets match; Vanilla and optional-mod compatibility requirements remain met.
10. Verified Vanilla patterns/scopes, automated regressions, and relevant EPOCH logs have documented results. Static checks are not represented as runtime proof.
11. Each participating empire receives at least one permanent, proportionate, path-dependent negative gameplay consequence. The effect is appropriate to empire class, persists through save/load, and cannot expire through a normal timed modifier.
12. Conclusion choices use only in-world language; no player-facing text exposes internal campaign opt-out or mod participation state.
13. The Silent Structure and conclusion preserve uncertainty: neither explains the origin, purpose, complete signature, full causal link, later phases, or UAP. Gameplay consequences can exceed the empire's known explanation.

If a criterion is open, report the cause, effects, evidence, and a concrete resolution. Do not label Phase I complete while a material criterion remains open. User-led comprehensive in-game milestone testing follows technical implementation and review; no partial in-game test is a substitute.
