# Phase II Block A — Awakening implementation

This note records the implemented Chapter 1–3 boundary for review. The content
is a source-level implementation for Stellaris 4.5.3; it has not been loaded
or played in game.

## Entry and migration

Continuing Phase I saves the conclusion capital as a country-keyed event target
and schedules the Phase II dispatcher. It waits about 1,780 days plus a saved
random delay of up to 180 days. The dispatcher has independent flags for the
original contamination site, capital scar, legacy scar-feature conversion,
and invitation schedule. A yearly country-local recovery hook can restore a
missing delayed invitation; invitation flags make duplicate queued copies
inert. The Phase I opt-out blocks entry. Nothing restarts Phase I.

The original contamination site and the Phase I conclusion capital remain
separate records. Block A adds presentation-only planet-feature deposits for
the four contamination outcomes and three empire-class scar descriptions.
Existing permanent planet modifiers remain the source of the original
economic effects, so conversion cannot remove or duplicate their penalties.
This is intentional because the Phase I effects are modifiers rather than
deposit-equivalent economic effects. If both records name one planet, it can
carry both features. New saves keep the conclusion-capital target even if the
world later changes hands. For older saves without that target, the once-per-
empire fallback scans planets with the old permanent scar modifier. That finds
owned former capitals, but a scar on a world already transferred away before
migration remains represented by its original modifier and may not receive a
new visual feature. No old gameplay choice or modifier is rewritten.

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

| Chapter | Player action | Completion record |
|---|---|---|
| 1 — The Scar Wakes | Choose an approach, then complete the staffed Science Ship survey or use the archive recovery route | `epoch_ii_ch1_resolved` |
| 2 — The First Hunters | Resolve an owner-targeted Nullwarden encounter by combat, defense/withdrawal, or staffed signal-diversion project | `epoch_ii_ch2_resolved` |
| 3 — The Broken Code | Choose restraint, intensive reconstruction, or remote analysis; complete a real project or use the paid archive fallback | `epoch_ii_ch3_resolved` |

Chapter 2 distinguishes destroyed wrecks from surviving signal traces. A
military loss is an explicit withdrawal outcome and does not end the campaign.
The fleet is never removed by an elapsed-time despawn; resolution or campaign
closure removes it. Chapter 3 awards research leads, not free technologies.
Resonance Spectroscopy is a repeatable Physics research with a country Physics
research bonus. Adaptive Resonance Armor requires Spectroscopy and standard
armor research, then unlocks a working small-ship armor component. No Chapter 4
content is launched. Completion sets `epoch_ii_handoff_ready` and closes the
Block A Situation.

## Military and recovery design

Each campaign owner creates one hostile-only Nullwarden country and one fleet.
The fleet consists of two event-design corvettes, increasing to four when the
campaign owner has Destroyers technology. The design has mass-driver weapons,
shield and armor defenses, and a defined power value. It targets only that
owner's saved campaign system and planet. The fleet has no independent pulse
or colony behavior. The combat route gives the player 150 days to engage before
an explicit win/withdrawal decision. The defensive route costs alloys and
energy, grants eight defensive armies on the campaign target for 180 days, and
then offers to hold the fortified perimeter, evacuate sensitive records and
withdraw, or abandon the cordon. The evacuation is recorded separately from a
generic withdrawal. The scientific route requires a staffed Science Ship and
Scientist, with a costly withdrawal recovery if its project fails.

## Static checks and limits

`scripts/test_phase_ii_block_a.cjs` checks braces, event-kind references,
stage gates, migration guards, localization references, real project callback
types, fleet ownership/design references, technology leads, and the component
definition. `scripts/test_epoch_regressions.ps1` runs this with the Phase I
regressions and `git diff --check` is run separately.

These checks do not validate the Clausewitz parser, actual event scopes, game
UI, AI project assignment, save/load behavior, multiplayer, combat balance, or
planet-feature rendering. No game launch or in-game test was performed, in
keeping with the Phase II development rule. Historical log summaries in the
existing validation report are pre-fix evidence and are not validation of this
implementation.
