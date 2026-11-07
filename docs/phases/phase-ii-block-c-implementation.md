# Phase II Block C — The Decision

**Branch:** `feature/phase-ii-finale`  
**Target:** Stellaris 4.5.3  
**Scope:** Chapters 7–8 only; Phase III content is not started.  
**Runtime status:** Static source checks only. No game was launched.

## Campaign integration

The fresh campaign now carries `epoch_resonance_protocol` through the Block B report and into Chapters 7–8. Block B sets `epoch_ii_block_b_complete` and `epoch_ii_handoff_block_c_ready` in its report; the active flag and saved `epoch_ii_resonance_stability` stay in place until an ending is chosen and the final Situation completes.

Older Block B builds could destroy the Situation and remove `epoch_ii_active` before saving the C handoff. The existing owner-local yearly `epoch_ii.0` recovery now detects that exact saved handoff, restores the active gate, and starts `epoch_resonance_chamber_recovery` directly at Chapter 7. It does not replay Chapters 1–6 or reset stability. The Phase I opt-out still blocks campaign dispatch. Phase I planet modifiers and deposits are untouched.

The shared Situation contains source-gated stages for all eight chapters: 19 ordered stages ending at progress 230. Every Chapter 7 stage and the final Chapter 8 choice has its own saved release flag. The C-only recovery Situation has five Chapter 7–8 stages and a separate progress scale, so older B-complete saves do not wait through earlier chapters. Completion sets `epoch_ii_phase_complete`, the selected ending, and `epoch_ii_phase_iii_handoff_ready`, then closes the Situation. No Phase III content is launched.

## Chapter 7 operation

The operation has four steps and three real Special Projects:

1. **Outer boundary:** a staffed Science Ship and scientist map the outer layer in `EPOCH_II_CHAMBER_BOUNDARY` (180 days). Phased Sensors enable a shielded alternative. Forced entry changes stability and costs alloys and energy. A paid archive route resolves the stage if the site, ship, or access is missing.
2. **Counter-pattern:** complete Phase I and Chapter 5 records can be compared directly. Partial or archived expedition data costs energy and stability; incomplete records with no recovered node use a damaged archive fallback. A staffed comparison project, `EPOCH_II_CHAMBER_COUNTERPATTERN` (240 days), is available when a node can still be reached.
3. **Instability:** activating the boundary immediately reduces the carried stability, then presents resource-consuming organic, hive, and machine responses. A costly one-use emergency array is available to every empire type. If it is unaffordable, an austerity response remains available at a further stability cost. Resonance-sensitive owned worlds receive persistent crisis scars; Phase I planet effects remain separate.
4. **Control:** `EPOCH_II_CHAMBER_CONTROL` (270 days) is discounted by the researched Resonance Field Control technology. Without it, a one-use array costs more alloys and energy and reduces stability. If no staffed project is possible, remote observation can still close the operation at a high energy or stability cost.

The operation saves `epoch_ii_chamber_system@root` from the accessible interrupted Chapter 5 node, falling back to the delayed-reflection node. It does not use the original contamination site's system as a substitute for convergence. If neither saved node remains accessible, the archive route stays available. Project attempts require a staffed Science Ship and scientist; each project failure or cancellation offers one paid retry and an archive recovery. The project callbacks do not mark work complete until the matching project succeeds or the player selects the documented fallback.

The stability variable is never reset in Block C. Existing Block B logic bounds changes at 0–100; all new changes call `epoch_ii_clamp_resonance_stability`. A stability reading of 70 or more unlocks a safer boundary analysis; below 40, the sensor scan costs more and the counter-pattern comparison is strained. Critical stability adds a further stability loss and planetary devastation when the chamber surges. The crisis offers a costly recovery even at critical stability, so no stability threshold blocks campaign completion.

Review follow-up: the three successful ship callbacks (`epoch_ii.136`–`.138`) now enter country events `.130`, `.132`, and `.134` in the owning campaign empire's country scope. The handlers have explicit project-start, active-campaign, and unresolved gates, set the stage flag before paying the one-time reward, then release the matching Situation gate. Repeated callbacks therefore fail the handler trigger after the first completion. The counter-pattern's fast route now requires complete records from two actually surveyed Chapter 5 nodes; its text explains that this reuses prior field research. The fresh 240-day staffed project remains available as a separate verification route and grants its own success reward.

## Resonance Field Control

`tech_epoch_resonance_field_control` is a tier-three Engineering research option offered on entering Chapter 7. Its valid scripted `potential` uses the specified OR: Adaptive Resonance Armor plus Contamination-Neutral Infrastructure, or Phased Sensors. It also requires the existing Resonance Spectroscopy prerequisite. It is researched normally and is never granted automatically.

The technology grants a lasting 3% Physics research bonus and lowers the final controlled-operation commitment to 200 Alloys and 200 Energy, compared with the no-tech one-use array's 500 Alloys and 700 Energy. The no-tech route remains completable through the archive/observation outcome at additional stability or energy cost. The technology remains useful after Phase II.

## Chapter 8 outcomes

Each outcome has an exclusive country flag, a permanent modifier, a planet or archive consequence, and its own Phase III record. A common guarded resolver refuses to apply a second outcome, clears conflicting ending flags/modifiers before the first application, and clamps stability. A yearly owner-local aftershock check gives each ending a different chance of a later incident; the event's resource or stability cost depends on the saved ending.

| Ending | Persistent effect and cost | Site record | Phase III record |
|---|---|---|---|
| `epoch_ii_ending_boundary` — Keep the Boundary | Lower Physics research and Energy output; raises resonance stability on resolution; pay Energy or take a stability loss | Existing resonance site becomes Controlled; capital scar stays intact | `epoch_ii_phase_iii_suppression_map` |
| `epoch_ii_ending_listen` — Listen Under Guard | Higher Physics research, lower Energy output, slight stability loss; retains exposure and incident risk | Site becomes Controlled-with-channel | `epoch_ii_phase_iii_live_channel` |
| `epoch_ii_ending_outward` — Turn Signal Outward | Fleet fire rate improves; Physics research and stability fall; network exposure is recorded | Site remains Active | `epoch_ii_phase_iii_outbound_bearing` |
| `epoch_ii_ending_break` — Break the Instrument | Lower Physics research and Alloy output; improves stability; retains permanent chamber ruin | Site becomes Unstable and gains `d_epoch_chamber_ruin` plus a permanent output penalty; if unavailable, the archive is marked damaged | `epoch_ii_phase_iii_damaged_fragment` |

All four decisions are displayed even when stockpiles are low. A missing resource payment turns into an explicit stability cost instead of hiding the ending. Historical Phase I contamination and conclusion-scar consequences are not removed. The event `epoch_ii.129` shows a distinct ending report. Project-only flags are cleaned after the report; durable outcome, source, evidence, and handoff flags remain.

## Prior choices used

The final operation reads real saved decision flags rather than substituting alternate dialogue. Among the recorded consequences:

- Phase I cautious/aggressive investigation changes stability; worsened contamination adds further risk.
- Phase I expedition contact loss marks the comparison as degraded; recovered survivors add Society research.
- Phase I forced structure mapping costs stability; a matched structure echo yields extra Physics data.
- Block A wreck recovery adds Engineering evidence; successful diversion records a different signature.
- Block B complete, partial, and archive-only expedition outcomes unlock different comparison routes and costs.
- The Chapter 5 dark-system or broadcast outcome changes suppression data and exposure risk.
- Chapter 4 quarantine versus exploitation changes the crisis's stability result.
- Chapter 6 destruction versus withdrawal changes stabilization evidence and adds extra material cost to low-evidence control.
- Phased Sensors unlock a safer outer-boundary option; researched Resonance Field Control unlocks the cheaper final operation.

Event targets and campaign flags are owner-scoped. The four crisis responses are class-specific; no biological resource is required by machine empires. AI choices have nonzero weights, and every stage has an archive or emergency route that does not depend on AI assigning a missing project.

## Regression results and limits

The requested regression runner now includes the Chapter 7–8 source checks and an eight-chapter campaign model. The tests inspect the current stage thresholds, callbacks, event flags, project requirements, technology trigger, exclusive ending effects, localized keys, and migration route. `git diff --check` is also required.

The available local Stellaris 4.5.3 source extract was checked for the changed engine patterns: `common/special_projects/00_projects_2.txt` shows staffed Science Ship requirements and `on_success = { ship_event = ... }`; `common/special_projects/00_projects_1.txt` and `common/special_projects/00_projects_distant_stars.txt` show `on_fail` and `on_cancel` dispatching country events; `events/first_contact_dlc_situation_events.txt` (`preftl.41`) uses a ship event's `owner` scope to invoke a country event; `events/on_action_events_1.txt` (`action.32`) sets a country flag directly in `country_event` scope; and `events/situation_events.txt` plus `common/scripted_effects/02_machine_age_effects.txt` demonstrate `enable_special_project` with `owner` and `location` fields. The callback fix follows those scope conventions.

The static checks cannot parse Clausewitz script with Stellaris, verify actual project dispatch/pathfinding, confirm UI presentation or AI project assignment, simulate saved event-target persistence in a running game, or establish gameplay balance. The local source extract does not contain a full modifier or console-command definition set. The in-game test below remains required before release. No merge is included.
