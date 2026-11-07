# Phase II Block A — Awakening implementation

**Historical implementation report for the former eight-chapter Stage II prototype. Not current design authority.** The active five-chapter contract is [Stage II – Resonance](phase-ii-resonance.md); see the [migration register](../architecture/content-migration.md). Facts below are retained as historical implementation evidence.

This note records the implemented Chapter 1–3 boundary for review. The content
is a source-level implementation for Stellaris 4.5.3; it has not been loaded
or played in game.

## Entry and migration

The Phase II invitation clock starts on the player's Phase I continuation
decision. Each empire saves one randomized delay between 1,780 and 1,960 days;
the persisted timer and delayed event share that exact due date. A yearly
owner-local recovery can restore a lost event only after the timer expires.
Duplicate queued invitations are inert, and the Phase I opt-out blocks entry.
The dispatcher has independent flags for the original contamination site,
capital scar, legacy scar-feature conversion, and invitation schedule. Migration
revision 2 clears the earlier implementation's premature completion markers.
Missing or foreign original-site references are provisional non-applicable
states retried by the yearly owner-local dispatcher; they do not set the
completion flag. Legacy scar conversion revisits only currently owned planets
and checks deposits before adding them, so a formerly foreign scar can be
represented after reacquisition. Nothing restarts Phase I.

The original contamination site and the Phase I conclusion capital remain
separate records. Block A adds presentation-only planet-feature deposits for
the four contamination outcomes and three empire-class scar descriptions.
Existing permanent planet modifiers remain the source of the original
economic effects, so conversion cannot remove or duplicate their penalties.
This is intentional because the Phase I effects are modifiers rather than
deposit-equivalent economic effects. If both records name one planet, it can
carry both features. New saves keep the conclusion-capital target even if the
world later changes hands. For older saves without that target, the once-per-
empire fallback scans only planets owned by that empire for the old permanent
scar modifier. A scar on a transferred world is left untouched while foreign
and picked up by a later owned-planet scan if reacquired. No old gameplay
choice or modifier is rewritten.

On invitation, the recorded site is activated if still owned by the campaign
empire. Otherwise an owned capital (or another owned planet) anchors the
investigation while archived Phase I records provide the lost-site path.

## Situation and chapters

`epoch_resonance_protocol` uses fixed, monotonic stage thresholds. Research
stages release explicit chapter actions; wait stages have no progress until a
chapter resolution flag is set. Monthly callbacks only update the bounded
0–100 resonance-stability variable and recover a missing chapter prompt. They
do not resolve projects or award research. Approaches differ in progress,
upkeep, research benefit, and their once-per-approach stability shift.

Chapter 3 follows the 60–80 research stage without requiring its own completion
flag. At 80, the handoff stage opens the Chapter 3 decision and waits there
while a project or recovery route is pending. The actual result report sets
`epoch_ii_ch3_resolved`; only then can progress reach 90 and complete Block A.
The flow model runs the six source thresholds through Chapter 1, two Chapter 2
resolutions, the Chapter 3 project, cancellation, and missing-target recovery.

| Chapter | Player action | Completion record |
|---|---|---|
| 1 — The Scar Wakes | Choose an approach, then complete the staffed Science Ship survey or use the archive recovery route | `epoch_ii_ch1_resolved` |
| 2 — The First Hunters | Resolve an owner-targeted Nullwarden encounter by combat, defense/withdrawal, or staffed signal-diversion project | `epoch_ii_ch2_resolved` |
| 3 — The Broken Code | Choose restraint, intensive reconstruction, or remote analysis; complete a real project or use the paid archive fallback | `epoch_ii_ch3_resolved` |

Chapter 2 distinguishes destroyed wrecks from surviving signal traces. A
military loss is an explicit, costly withdrawal outcome and does not end the
campaign. Surviving Nullwarden fleets change stance, stop targeting the owner,
and move toward an accessible system away from the campaign target; scripts
never destroy a living fleet or remove it on a timer. If no route is available,
the fleet remains passive and the owner-local yearly recovery retries the
route. A destroyed fleet, missing saved country target, or repeated resolution
is handled idempotently. Chapter 3 awards research leads, not free technologies.
Resonance Spectroscopy is a repeatable Physics research with a country Physics
research bonus. Adaptive Resonance Armor requires Spectroscopy and standard
armor research, then unlocks a working small-ship armor component. No Chapter 4
content is launched. Completion sets `epoch_ii_handoff_ready` and closes the
Block A Situation.

## Military and recovery design

Each campaign owner creates one Nullwarden country hostile only to that owner
and one fleet.
The fleet consists of two event-design corvettes, increasing to four when the
campaign owner has Destroyers technology. The design has mass-driver weapons,
shield and armor defenses, and a bounded custom military power of 120 per
corvette. It targets only that
owner's saved campaign system and planet. The fleet has no independent pulse
or colony behavior. The combat route gives the player 150 days to engage before
a win/withdrawal decision. Defense costs alloys and energy but creates no free
space defense or reported armies. Holding requires a real owner fleet in the
target system with at least 240 fleet power against two corvettes or 480
against four. Evacuation and withdrawal have separate records, resource costs,
stability losses, and target-planet devastation. Every special project requires
an actual staffed Science Ship at an owned location, has a time limit, and
aborts when its site is lost. Failure and cancellation take distinct recovery
paths; retry and archive routes prevent dead ends, including for the AI. Signal
diversion costs resources and stability when started, risks site devastation,
and only a successful project diverts the live force.

## Static checks and limits

`scripts/test_phase_ii_block_a.cjs` checks braces, event-kind references,
stage gates, migration guards, localization references, real project callback
types, fleet ownership/design references, technology leads, and the component
definition. `scripts/test_phase_ii_flow_model.cjs` simulates source thresholds,
wait gates, migration retries, and retreat states. `scripts/test_epoch_regressions.ps1`
runs these with the Phase I regressions; `git diff --check` is run separately.

These checks do not validate the Clausewitz parser, actual event scopes, game
UI, AI project assignment, save/load behavior, multiplayer, combat balance,
route execution by the fleet pathfinder, or planet-feature rendering. The
retreat route checks use the installed Vanilla 4.5.3 `has_access_fleet`,
`closest_system`, and `queue_actions` patterns, but actual path completion
still needs an in-game run. No game launch or in-game test was performed.
Historical log summaries in the existing validation report are pre-fix
evidence and are not validation of this implementation.
