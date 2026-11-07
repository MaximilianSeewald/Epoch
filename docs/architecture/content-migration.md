# Content Migration and Documentation Authority

**Status: Binding documentation and code-migration register.** This PR changes documentation only. All gameplay files listed below remain in the repository unchanged until a separate, reviewed code PR.

## Source hierarchy

When active documents disagree, apply this order:

1. [Current architecture and invariants](../architecture.md).
2. Current [Stage I](../phases/phase-i-first-contact.md), [Stage II](../phases/phase-ii-resonance.md), [Stage III](../phases/stage-iii-military-crisis.md), and [Stage IV](../phases/stage-iv-ascension.md) specifications.
3. Current gameplay-system and content contracts ([Stage II systems](../phases/phase-ii-systems.md), [catalog](../phases/phase-ii-content-catalog.md), [decisions](../phases/phase-ii-decisions.md)).
4. Current [testing policy](../testing.md) and stage acceptance criteria.
5. Technical references and ADRs, only for claims within their recorded evidence boundary.
6. Archived implementation reports, former block plans, and historical evidence.

Status labels determine authority. `Binding` is current scope; `Historical` preserves an earlier state without directing new work; `Evidence` reports what a specific test/review observed; `Open` means no implementation requirement is yet decided. Historical text is not retroactively rewritten to claim new outcomes.

## Architecture and content migration matrix

| Legacy artifact/idea | Decision | Current destination/action |
|---|---|---|
| Eight-chapter Stage II and old Block A/B/C chapter mapping | **Remove from active contract** | Replace with exactly five chapters in Stage II spec. Old block reports are marked historical. |
| Chapters 1–3: Scar Wakes, First Hunters, Broken Code | **Revise** | Keep story concepts in new Stage II chapters 1–3; rebuild against actual project/fleet/action requirements. |
| Old Chapters 4–5 and Block B progression | **Revise** | Rebuild as playable Second Infection and Network of Silence; do not inherit thresholds or mechanics blindly. |
| Old Chapter 6 adapted Nullwarden finale | **Move** | Larger adapted military escalation belongs to Stage III. Prototype event/ship content is inventory only pending design. |
| Old Chapter 7 Resonance Chamber | **Remove from Stage II; archive/reassess** | No future stage assignment is settled. Stage IV is a candidate, not a binding destination; the chamber's future need and function are open. |
| Old Chapter 8 Countermark and four mandatory final decisions | **Remove from Stage II; archive/reassess** | The four outcomes (Keep Boundary, Listen Under Guard, Turn Signal Outward, Break Instrument) are not Stage II requirements. Whether to retain, redesign, and where to place any concept remains open; Stage IV is a candidate only. |
| Old 19-stage situation, six-stage architecture, and M0/M4/M5/M6/M7 plan | **Archive** | Historical planning labels only; current architecture has four stages. |
| Old progress thresholds, 0–100 Stability, invitation/handoff flags | **Reassess/migrate** | None is binding. Audit every read/write in callbacks and saves; replace only with an approved state model. |
| Nullwarden fleets and ship designs (`epoch_nullwarden`, `epoch_nullwarden_designs.txt`, `epoch_ii.15` onward) | **Revise** | Chapter 2 needs a real first hostile fleet; adapted fleet concept moves to III. Audit country type, designs, components, spawn, hostility, AI, cleanup, and event references. |
| Resonance Protocol situation and Chamber recovery situation (`epoch_resonance_protocol`, `epoch_resonance_chamber_recovery`) | **Replace/remove prototype stages** | Retain Stage II only if rebuilt around five chapters; remove Chamber recovery stage. Audit every callback and entry hook before removing definitions. |
| Planetary features (Contamination, Scar, Silent Structure) from PR #11 | **Keep** | Shared foundation; one visible state per family per planet, non-clearable, actual economic effects. Keep state setters/migration compatible with Stage I. |
| Old Phase II deposit variants and modifier state model | **Replace in code PR after audit** | Preserve PR #11 shared feature state/economics. Remove duplicate competing representation only after caller, saved-state, and localisation migration is designed. |
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
| Old Phase II acceptance script/checkpoint names and four-ending expectations | **Archive/replace** | Use new five-chapter test plan. Historical results remain evidence about the prototype only. |
| Stage I tests, scripts, and Stage I feature behavior | **Keep** | Add non-regression coverage for entry/exit, permanent scars, no re-enrollment, all empire classes, and PR #11 features. |

The table is the initial content classification from repository inspection, not proof that a prototype item works in game. Detailed code references must be regenerated in the implementation PR immediately before deletion because callback/reference networks can change.

## Required next code-PR cleanup sequence

1. Inventory and map every `epoch_ii.*` event ID; every project key; situation type/stage; flag/variable/event target; technology, building, component/template, country type, deposit/feature and modifier; scripted effect/trigger; localization/GFX key. Search incoming **and** outgoing references across `common/`, `events/`, `localisation/`, and `scripts/`.
2. Design and review the five-chapter replacement state flow and old-save migration before modifying scripts. Define what old saves do if they are pre-entry, mid-chapter 1–5, in obsolete chapters 6–8, or closed with an old outcome.
3. Keep Stage I and PR #11 feature setters/state data intact; add a compatibility/migration adapter for Stage I feature states if the new Stage II model needs conversion. Do not silently drop modifiers, deposits, or permanent consequences.
4. Add the replacement Stage II situation/events/projects and their validated targets/callbacks. Run the new entry path on fresh saves and migrated save classes. Explicitly remove/deactivate obsolete dispatches and automatic fire sources (yearly pulse, on-action, project completion, situation callback, delayed event) so unreferenced old events cannot start.
5. Remove obsolete situation stages, old events, old projects, technologies/buildings/components, flags/effects, and their localisation only after incoming/outgoing reference searches are clear and new replacement paths exist. Preserve genuinely reusable content under the new contract.
6. Replace the eight-chapter regression model and stale test expectations with five-chapter static checks plus real-game acceptance. Keep Stage I regressions and log checks.
7. Verify fresh and old saves, all empire classes, AI, concurrent empires, save/load, multiplayer host/client, Vanilla-only, and optional Gigastructures separately. Do not report in-game success from static checks.

No gameplay scripts were altered in this documentation PR. Old Stage II code remains present and may contain auto-dispatch paths; its cleanup and prevention of old-event firing are explicit next-PR requirements, not completed actions here.

## Documents reviewed for this consolidation

The complete Markdown review set is:

- Root: `README.md`.
- Core: `docs/architecture.md`, `docs/discovery-framework.md`, `docs/pr-11-core-gameplay-ui.md`, `docs/roadmap.md`, `docs/story-bible.md`, `docs/technical-reference.md`, `docs/testing.md`.
- Architecture: `docs/architecture/content-migration.md` (created here), `docs/architecture/m0-d-core-bootstrap-uap.md`, `docs/architecture/decisions/ADR-001-country-start-bootstrap.md`, `docs/architecture/decisions/ADR-002-empire-uap-state-machine.md`, `docs/architecture/decisions/ADR-003-event-driven-deterministic-scheduling.md`, `docs/architecture/decisions/ADR-004-optional-gigastructures-bridge.md`.
- Evidence: `docs/evidence/m0-b-engine-verification.md`.
- Stage specifications: `docs/phases/phase-i-first-contact.md`, `docs/phases/phase-ii-resonance.md`, `docs/phases/phase-ii-systems.md`, `docs/phases/phase-ii-content-catalog.md`, `docs/phases/phase-ii-decisions.md`, `docs/phases/phase-ii-development-blocks.md`, `docs/phases/phase-ii-block-a-implementation.md`, `docs/phases/phase-ii-block-b-implementation.md`, `docs/phases/phase-ii-block-c-implementation.md`, `docs/phases/stage-iii-military-crisis.md` (created here), `docs/phases/stage-iv-ascension.md` (created here).
- Test plans/reports: `docs/testing/phase-i-acceptance.md`, `docs/testing/phase-ii-full-acceptance.md`, `docs/testing/m0-c-runtime-test.md`.

The M0-B evidence matrix and M0-C runtime report were read as historical evidence and left unchanged; no historical result was rewritten to claim a new outcome. No Markdown document was deleted. Three former Block A/B/C implementation reports were retained and marked historical; the old Stage II acceptance and active specification files were replaced with current five-chapter contracts.
