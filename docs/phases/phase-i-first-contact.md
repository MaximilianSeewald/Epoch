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
| 2. Missing Expedition | The player selects an existing owned science ship with a scientist in the fleet and sends it to the saved destination's Special Project. The completion callback identifies the ship that actually performed the project; that ship is removed and its scientist reference is recorded. A player-owned pre-existing ship must never be removed unless it was the ship that completed this project. Search uses projects and/or other native mechanics. Rescue, recovery, survey, and abandonment must yield conditional, non-guaranteed outcomes, including loss. First Echo choices alter available routes, cost, or risk. AI completion and ship loss before callback remain verification requirements. |
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

**Implementation snapshot:** `epoch_core_events.txt` connects all five
sections. Missing Expedition is enabled at the saved destination as a native
Special Project; the player assigns an owned Science Ship and scientist, and
the ship-scoped success callback saves that exact ship and fleet leader before
destroying the ship. Search outcomes resolve the saved scientist as recovered
or lost. Project failure and timeout leave the assigned ship intact. The
Silent Structure is a native four-stage Archaeological Site, with staffed
Science Ship requirements, four archaeology callbacks, conditional chapter
choices, and distinct secure, destroy, and investigate outcomes. Contamination
uses permanent planet modifiers with separate organic, Hive Mind, and machine
effects; neglect worsens the source world and attempts one guarded spread to
another owned world. Phase I conclusion applies a permanent class-specific
planet scar, intensified by recorded campaign outcomes, before offering
continuation or an in-world permanent closure choice.

**Vanilla source verification:** the target installation is Stellaris 4.5.3
(build 26325427). Its `common/special_projects/00_projects_1.txt` and
`common/on_actions/00_on_actions.txt` confirm `event_scope = ship_event` and
that special-project success dispatches in the performing ship scope. The
installed `common/archaeological_site_types/99_README_ARC_SITES.txt` documents
site `potential`/`allow` as fleet scope with `from` the site and `visible` as
country scope with `from` the site; `00_base_game_arc_sites.txt` supplies
matching multi-stage definitions. Vanilla archaeology callbacks use
`archaeology = yes`, `set_site_progress_locked = yes`, and site destruction is
demonstrated in `events/paragon_events_3.txt`. Vanilla files also contain the
planet job-output modifiers, ship/fleet leader flags, `kill_leader`,
`abort_special_project`, and `exists = archaeological_site` used here.

These sources establish script patterns, not EPOCH parser or runtime success.
The project definition cannot pre-bind a ship; native project assignment lets
the player select the ship, and the success callback identifies the ship that
actually completed it. AI assignment/completion, interrupted ship or leader
behavior, dynamic event-target persistence, archaeological-site UI/progress,
save/load, multiplayer, and end-to-end in-game behavior have not been run in
Stellaris. Regression results are static checks only; no Phase I completion
claim is made until those runtime and integration criteria are verified.

The earlier supplied M0-B subset identifies `on_survey_planet` as **Ship scope** with **From = Planet** (`common/on_actions/00_on_actions.txt:1129–1137`). The installed 4.5.3 source confirms the same hook and documents `on_planet_surveyed` separately as Root = Planet, From = Country, with FromFrom as the surveying fleet when present; the latter can also fire from intel changes without a ship. EPOCH therefore uses the ship-scoped survey hook. Its nested `from.solar_system`, owner-keyed target names, and saved target lifecycle are source-pattern-supported but still need EPOCH runtime coverage.

The installed project definitions and special-project on_action comments confirm `event_scope = ship_event` callbacks use the performing ship context. They do not add an explicit pre-assignment ship reference to the project definition; the player's choice occurs through native project assignment. The EPOCH callback stores that ship and its fleet leader before destroying the ship. This proves source-supported callback scope and exact callback target, not leader survival behavior, project cancellation ordering when the ship is lost, or saved-target persistence. Those lifecycle points remain unverified until runtime coverage.

Special-project definitions, situation callbacks, archaeological-site definitions, planet modifiers, and their effects are source-supported patterns, not proof of EPOCH parser or runtime behavior. The site uses the documented fleet/site/country scope split and four native stages. Verify EPOCH parser acceptance, project prerequisites, callback timing, AI project/site assignment, scientist state after ship removal, timed fallbacks, save/load, missing-object behavior, and simultaneous-empires isolation against the target build. No unsupported runtime assumption is accepted as verified.

Record status as `VERIFIED – SOURCE`, `VERIFIED – RUNTIME`, `PROPOSED`, or `UNVERIFIED`; never describe static assertions as proof of in-game behavior. If a native mechanism cannot be made reliable, document the tested limitation and use a technically viable gameplay substitute with equivalent observable results.

## Technical and gameplay completion criteria

Phase I is complete only when all are true:

1. This binding specification and linked architecture docs match the shipped implementation.
2. All five sections are playable, connected, and finishable, including failure and absent-object paths.
3. The player's chosen science ship and scientist perform the destination project; that exact ship's disappearance and scientist state are verified, with differentiated rescue, loss, and recovery outcomes.
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
