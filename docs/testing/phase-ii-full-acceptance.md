# EPOCH Phase II full acceptance test

**Target build:** Stellaris 4.5.3  
**Status:** Prepared, not run. Begin only after Block C has passed independent review and is merged.  
**Purpose:** One campaign supplies checkpoints for all eight chapters; branch the Chapter 8 save to test all four endings without replaying the campaign.

## Launcher and save setup

1. Use a clean Stellaris 4.5.3 installation and the EPOCH mod version from the merged PR. Confirm the launcher has only the intended EPOCH descriptor active and no older EPOCH copy or competing Phase II build.
2. Disable Ironman and achievements so multiple named checkpoint saves can be created. Do not use console commands for the primary run; those would bypass Situation gates and do not validate projects or their callbacks.
3. Start a new galaxy with a normal organic empire and keep the game running at normal speed when checking event order. Record the game version, checksum, mod descriptor, empire type, galaxy seed, and date in the run log.
4. Make a separate manual save at each checkpoint named below. For the final tests, copy the `Before_Countermark` save to four new save slots; do not overwrite the common checkpoint.
5. A focused event-window smoke test may use Stellaris' `event <event_id>` console form for country events, but it is not part of the campaign PASS criteria and must not be used to skip conditions. The cited console-command catalogue is generated from Stellaris 4.5.2 executable help; confirm the command in the 4.5.3 console before using it. Never use it to claim Situation, project, or AI validation. [StellarisDB console command reference](https://stellarisdb.com/console-commands)

## Evidence and checkpoint names

Capture a screenshot of the visible Situation stage and choice, plus the project card or planet view when applicable. Save `game.log` and `error.log` after the run. Keep files under a run folder with date, version, mod revision, seed, and empire type. For every FAIL, record the exact date, event ID shown in the log, save name, current resources, stability value, country flags from a save inspection if practical, and a screenshot.

Required checkpoints:

- `After_Phase_I_Decision`
- `After_Ch1_Baseline`
- `After_Ch2_Wardens`
- `After_Ch3_Code`
- `After_Ch4_Protocol`
- `After_Ch5_Nodes`
- `After_Ch5_Silence`
- `After_Ch6_Wardens`
- `After_Block_B_Report`
- `After_C7_Outer_Boundary`
- `After_C7_Counterpattern`
- `After_C7_Instability`
- `After_C7_Control`
- `Before_Countermark`
- `After_Each_Ending` (four independent copies)

## Campaign walkthrough

### Phase I and entry

- Complete Phase I through a cautious approach, keep a record of the contamination world and capital scar, and choose to continue. Verify the five-year invitation clock starts at the final Phase I decision and that no Phase II Situation or project appears before it expires.
- At invitation, confirm the Phase I outcome deposits and permanent modifiers remain on their recorded worlds. Save `After_Phase_I_Decision` and then `After_Ch1_Baseline`.
- Complete the staffed Chapter 1 Science Ship survey. Confirm a scientist is required, a real project appears, and the report records the result only after completion.

### Chapter 2 — The First Hunters

- Observe the first owner-targeted Nullwarden force. Use a military win for this campaign; record the result and retain a save before resolution if testing combat separately.
- Verify the fleet is a real hostile force, does not target another empire, and its resolution is not awarded merely because a fleet target disappears. Confirm the outcome report and chapter flag only after combat or a valid alternative.
- Save `After_Ch2_Wardens`.

### Chapter 3 — The Broken Code

- Select the forensic route and complete the staffed Science Ship Special Project. Verify research leads appear as research options and that Resonance Spectroscopy or Adaptive Resonance Armor is not granted for free.
- Save `After_Ch3_Code` and confirm the Situation enters Block B without a second invitation.

### Chapter 4 — The Second Infection

- Select quarantine, then resolve the anomaly, coordination, and breakthrough incidents. Confirm each choice has its listed resource, stability, or planet effect.
- On an owned resonance world, inspect its planet feature and modifier before and after each state transition. Confirm another world changes only after its explicit transfer choice.
- Build a Resonance Laboratory and Containment Infrastructure on an eligible colony. Verify costs, upkeep, planet limit, and that their state effects match the planet's current resonance flag.
- Save `After_C4_Protocol`.

### Chapter 5 — The Network of Silence

- Choose a staffed Science Ship expedition. Complete both distinct network-node projects and then the Silent System project at its barren-moon system. Record all three actual locations and project callbacks.
- Save `After_C5_Nodes`. Verify the complete data record and the Chapter 5 convergence-bearing node are preserved.
- Choose **keep the system dark** for the primary route. Verify the report does not identify an author for the grooves and does not restore any lost expedition member. Save `After_C5_Silence`.
- For an alternative route, reload `After_C5_Nodes` and test the shielded repeat or broadcast route. Confirm the stability/exposure change is real and carried to later chapters.

### Chapter 6 — The Wardens

- Encounter the second, adapted Nullwarden force. Use direct combat for the primary route and save before resolving.
- On separate copies, test a successful sensor/science countermeasure and withdrawal. Confirm the fleet is de-escalated only toward the campaign empire, surviving fleets are not deleted, and each result records its correct convergence-data quality.
- Save `After_C6_Wardens` and `After_Block_B_Report`. Confirm `epoch_ii_handoff_block_c_ready` leads to Chapter 7 without a new invitation, duplicate fleet, or stability reset.

### Chapter 7 — The Resonance Chamber

- At the boundary stage, verify the event points to the accessible Chapter 5 convergence-bearing node. Assign a staffed Science Ship and scientist; complete the 180-day boundary project.
- Before beginning, create copies to test: stable-network careful mapping; low-stability Phased Sensor scan at the higher cost; direct forced entry; no reachable convergence node; and a lost/cancelled Science Ship project. At high stability, verify the safe 180-day route and data bonus; below 40 stability, the safe route must be unavailable and the scan cost must rise. The missing-site and failure copies must offer the archive fallback, with its real cost or stability penalty.
- Save `After_C7_Outer_Boundary`. Reload it, then complete the counter-pattern step using complete data. On a copy with archive-only Chapter 5 data, confirm the lower-quality, costlier comparison route remains available.
- Save `After_C7_Counterpattern`. Observe the real instability stage. Test the organic response here and, on separate campaigns, the hive partition and machine sandbox. Verify resource loss, stability changes, planet scars, and that no biological resource is required for machines.
- On a copy, enter the crisis at low/critical stability and choose the expensive emergency array. Confirm the additional loss and planetary devastation are visible, stability remains within 0–100, and the campaign continues. On a high-stability copy, confirm the surge is marked contained and does not add critical devastation.
- Save `After_C7_Instability`. Research Resonance Field Control normally on one branch using the Phased Sensors prerequisite. On another, leave it unresearched and use the one-use array. Compare resource costs, then complete the staffed control project; use the remote observation route on a missing-site copy.
- Save `After_C7_Control` and `Before_Countermark`.

### Chapter 8 — The Countermark and four branches

- From four copies of `Before_Countermark`, choose exactly one result in each: **Keep the Boundary**, **Listen Under Guard**, **Turn Signal Outward**, and **Break the Instrument**.
- For every branch, verify the visible ending-specific report; exactly one ending flag; the matching permanent country modifier; the planet or damaged-archive result; a distinct Phase III record; `epoch_ii_phase_complete`; and final removal of the active Situation after its completion stage.
- Inspect the source and capital worlds. Confirm original Phase I scars and economic penalties remain. Confirm the broken instrument's ruin is persistent and earlier planet scars are not erased.
- Test one branch with insufficient stockpiles. Its option must remain visible and resolve through the documented stability penalty.
- Leave each branch running for at least five in-game years. Verify the ending's persistent economic/military modifier remains. Continue until its aftershock event appears; confirm the ending-specific resource/stability cost, then save `After_Each_Ending`, reload it, and confirm no second ending or duplicate modifier is applied.

## Save/load and regression checks

- Load `After_Block_B_Report` and verify the regular C path resumes with the same stability and chapter records.
- Load a save produced by the previously merged Block B implementation where the Situation is already closed and `epoch_ii_handoff_block_c_ready` is set. Allow one yearly owner-local recovery tick. Verify it starts the C-only recovery Situation, does not replay Chapters 1–6, and does not reset stability or spawn old fleets.
- Load each `Before_Countermark` copy and each ending save. Verify the chosen ending and persistent modifier are idempotent; no two ending flags coexist.
- Run `scripts/test_epoch_regressions.ps1` and `git diff --check` on the exact tested revision before filing the run report.
- Inspect `game.log` and `error.log` for EPOCH event, project, localization, scope, and modifier errors. The static tests passing is not a substitute for this runtime review.

## PASS / FAIL criteria

**PASS** requires every mandatory step to complete with the correct visible stage, real Science Ship project, project callback, owner-local flag, resource/stability change, planet effect, localized English and German text, and save/load recovery. Each of four ending branches must be exclusive, idempotent, persistent, and produce its own Phase III record. `error.log` must contain no new EPOCH script, event-scope, project, localization, or modifier failures attributable to the tested revision.

**FAIL** includes any early invite; repeated reward or Nullwarden spawn; missing/inaccessible project with no recovery; progress past an unresolved stage; stability outside 0–100 or a deadlock at critical stability; a machine-only food requirement; changed Phase I scar; missing or duplicate ending; lost Phase III result; wrong owner target; untranslated player-facing text; project cancellation treated as success; or new EPOCH runtime errors.

Report the game build/checksum, tested mod commit, empire class, seed, route, checkpoint names, all log findings, screenshots, and each PASS/FAIL result. Do not merge or publish a test claim from the static model alone.
