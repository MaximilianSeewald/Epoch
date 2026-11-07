# Content Migration and Documentation Authority

**Status: Binding code-migration register.** This documentation cleanup leaves all gameplay files unchanged. The next code PR must use this register before removing or replacing legacy content.

## Source hierarchy

When active documents disagree, apply this order:

1. [Current architecture and invariants](../architecture.md).
2. Current [Stage I](../phases/phase-i-first-contact.md), [Stage II](../phases/phase-ii-resonance.md), [Stage III](../phases/stage-iii-military-crisis.md), and [Stage IV](../phases/stage-iv-ascension.md) specifications.
3. [Acceptance criteria](../testing.md).
4. [Technical contracts and evidence limits](../technical-contract.md).

The Git history is the archive for removed reports. `Open` marks an undecided design choice. Source verification is evidence of a Vanilla pattern only, not proof of EPOCH parser/runtime behavior.

## Architecture and content migration matrix

| Legacy artifact/idea | Decision | Current destination/action |
|---|---|---|
| Eight-chapter Stage II and old Block A/B/C chapter mapping | **Remove** | Replaced by the five chapters in Stage II spec and its acceptance criteria. |
| Chapters 1–3: Scar Wakes, First Hunters, Broken Code | **Revise** | Keep story concepts in new Stage II chapters 1–3; rebuild against actual project/fleet/action requirements. |
| Old Chapters 4–5 and Block B progression | **Revise** | Rebuild as the Chapter 4 interactive planet-level containment mini-game and Chapter 5 multi-system exploration; do not inherit thresholds or mechanics blindly. |
| Old Chapter 6 adapted Nullwarden finale | **Move** | Larger adapted military escalation belongs to Stage III. Prototype event/ship content is inventory only pending design. |
| Old Chapter 7 Resonance Chamber | **Remove from Stage II; archive/reassess** | No future stage assignment is settled. Stage IV is a candidate, not a binding destination; the chamber's future need and function are open. |
| Old Chapter 8 Countermark and four mandatory final decisions | **Remove from Stage II; archive/reassess** | The four outcomes (Keep Boundary, Listen Under Guard, Turn Signal Outward, Break Instrument) are not Stage II requirements. Whether to retain, redesign, and where to place any concept remains open; Stage IV is a candidate only. |
| Old 19-stage situation, six-stage architecture, and M0/M4/M5/M6/M7 plan | **Remove** | Superseded; current architecture has four stages. |
| Old progress thresholds, 0–100 Stability, invitation/handoff flags | **Reassess/migrate** | Keep the design requirement that Stage II begins about five in-game years after the Stage-I continuation choice. Old implementation thresholds/flags are not binding. Audit every read/write in callbacks and saves; replace only with an approved state model. |
| Nullwarden fleets and ship designs (`epoch_nullwarden`, `epoch_nullwarden_designs.txt`, `epoch_ii.15` onward) | **Revise** | Chapter 2 needs a real first hostile fleet; adapted fleet concept moves to III. Audit country type, designs, components, spawn, hostility, AI, cleanup, and event references. |
| Resonance Protocol situation and Chamber recovery situation (`epoch_resonance_protocol`, `epoch_resonance_chamber_recovery`) | **Replace/remove prototype stages** | Retain Stage II only if rebuilt around five chapters; remove Chamber recovery stage. Audit every callback and entry hook before removing definitions. |
| Planetary features (Contamination, Scar, Silent Structure) from PR #11 | **Keep** | Shared foundation; state names and family/cardinality rules are in [Stage I](../phases/phase-i-first-contact.md). Preserve setter behavior, visibility, and actual economic effects. |
| Old Phase II event/flag layer representing planet state | **Migrate in code PR after audit** | Preserve PR #11 shared feature UI and economics. Retire duplicate state only after call-site, save, and localisation migration is designed. |
| Resonance Laboratory | **Reassess** | Candidate Chapter 3/5 or Stage IV infrastructure; not automatically retained. Verify its utility and costs in the chosen design. |
| Containment Infrastructure | **Revise** | Possible Chapter 4 support, only if real containment mechanics and planetary costs justify it. |
| Resonance Spectroscopy | **Reassess/retain as candidate** | Candidate research path from Chapter 3; no free grant; verify prerequisite and downstream references. |
| Adaptive Resonance Armor, Phased Sensors | **Reassess** | Candidate technologies; military adaptation primarily Stage III. Chapter 2/III allocation and research prerequisites remain open. |
| Contamination-Neutral Infrastructure | **Reassess** | Candidate Stage II/IV building technology; verify Stage I feature interaction, economic effects, and building dependencies. |
| Resonance Field Control | **Reassess** | Its Chamber dependency is from the retired prototype. A future role/stage is open; Stage IV is a candidate, not a mandatory Stage II tech. |
| All 13 prototype Stage II Special Projects (`EPOCH_II_SCAR_SURVEY`, `SIGNAL_DIVERSION`, `CODE_ARCHIVE`, `CODE_FORENSICS`, `CODE_RECONSTRUCTION`, `NODE_REFLECTION`, `NODE_INTERRUPTED`, `SILENT_SYSTEM`, `NODE_TRAP`, `SCIENCE_COUNTERMEASURE`, `CHAMBER_BOUNDARY`, `CHAMBER_COUNTERPATTERN`, `CHAMBER_CONTROL`) | **Reassess individually** | First ten are candidates for chapters 1–5 or III; last three depend on the unassigned Chamber concept. No project is declared safe/valid without target, owner, ship/scientist, callbacks, cancellation and reference audit. |
| Stage I/core Special Projects in `epoch_core_projects.txt` | **Keep subject to reference audit** | Includes `EPOCH_FIRST_ECHO_CAUTIOUS`, `EPOCH_FIRST_ECHO_AGGRESSIVE`, `EPOCH_ECHO_CALIBRATION`, `EPOCH_ECHO_BASELINE`, `EPOCH_ECHO_OVERDRIVE`, `EPOCH_ECHO_THROTTLED`, `EPOCH_MISSING_EXPEDITION`, `EPOCH_EXPEDITION_RESCUE`, `EPOCH_EXPEDITION_SALVAGE`, `EPOCH_EXPEDITION_SURVEY`, `EPOCH_CONTAMINATION_STUDY`, and `EPOCH_STRUCTURE_REMOTE_STUDY`. Preserve Stage I callbacks and identify any `epoch_ii` dependency before retiring old definitions. |
| Resonance Laboratory and Containment Infrastructure buildings | **Reassess** | Verify technology prerequisites, planet limits, resource categories, upkeep, and callers; retain only if mapped to accepted mechanics. |
| Old Phase II component set/templates (Resonance Armor, Phased Sensors) | **Reassess** | Depends on approved Stage III combat role and tech map; do not orphan tech, set, template, ship design, or localisation references. |
| Old Phase II and Block C event files (`epoch_phase_ii_events.txt`, `epoch_phase_ii_block_c_events.txt`; `epoch_ii.*`) | **Replace, then remove obsolete definitions** | Map each event ID, incoming dispatch, project/situation callback, and outgoing event. Retire Chamber and old finale events. Prevent dead content from auto-firing by removing verified dispatch sources, not by deleting definitions first. |
| Stage II on-actions/yearly pulse/fleet-destroyed callbacks | **Replace selectively** | Audit `epoch_core_on_actions.txt`, event trigger conditions and all callback scopes. Remove obsolete handlers only after replacement dispatch and Stage I non-regression are verified. |
| `epoch_core_effects.txt` Phase II helpers and feature setters | **Split decisions** | Keep PR #11 planetary feature helpers; identify and replace Phase II scheduling, target, stability, flag, and transition helpers. Search all call sites before each removal. |
| All `epoch_ii_*` country/planet/fleet/project flags and event targets | **Migrate or retire** | Build a read/write/call-site ledger; define old-save policy; map only information needed for five chapters and downstream III/IV. Do not bulk-clear state. |
| Old Block C modifiers/devastation and endings | **Remove from active Stage II** | Reassess consequences for Stage III/IV. Ensure no remaining callback or localisation references before code removal. |
| Old Phase II acceptance script/checkpoint names and four-ending expectations | **Remove** | Use the current five-chapter acceptance plan. |
| Stage I tests, scripts, and Stage I feature behavior | **Keep** | Add non-regression coverage for entry/exit, permanent scars, no re-enrollment, all empire classes, and PR #11 features. |

The table classifies legacy concepts, not evidence that a prototype item works in game. Detailed code references must be regenerated in the implementation PR immediately before deletion because callback/reference networks can change.

## Required next code-PR cleanup sequence

1. Inventory and map every `epoch_ii.*` event ID; every project key; situation type/stage; flag/variable/event target; technology, building, component/template, country type, deposit/feature and modifier; scripted effect/trigger; localization/GFX key. Search incoming **and** outgoing references across `common/`, `events/`, `localisation/`, and `scripts/`.
2. Design and review the five-chapter replacement state flow and old-save migration before modifying scripts. Define what old saves do if they are pre-entry, mid-chapter 1–5, in obsolete chapters 6–8, or closed with an old outcome.
3. Keep Stage I and PR #11 feature setters/state data intact; add a compatibility/migration adapter for Stage I feature states if the new Stage II model needs conversion. Do not silently drop modifiers, deposits, or permanent consequences.
4. Add the replacement Stage II situation/events/projects and their validated targets/callbacks. Run the new entry path on fresh saves and migrated save classes. Explicitly remove/deactivate obsolete dispatches and automatic fire sources (yearly pulse, on-action, project completion, situation callback, delayed event) so unreferenced old events cannot start.
5. Remove obsolete situation stages, old events, old projects, technologies/buildings/components, flags/effects, and their localisation only after incoming/outgoing reference searches are clear and new replacement paths exist. Preserve genuinely reusable content under the new contract.
6. Replace the eight-chapter regression model and stale test expectations with five-chapter static checks plus real-game acceptance. Keep Stage I regressions and log checks.
7. Verify fresh and old saves, all empire classes, AI, concurrent empires, save/load, multiplayer host/client, Vanilla-only, and optional Gigastructures separately. Do not report in-game success from static checks.

Old event, situation, project, feature, technology, building, flag, and script definitions remain in gameplay files and may still auto-dispatch. This document cleanup does not deactivate them. Their replacement and prevention of obsolete event firing are explicit next-code-PR requirements.
