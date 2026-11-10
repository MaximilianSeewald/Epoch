# Acceptance and Verification

Stage III's next connected run follows the [second-playtest changes and focused acceptance sequence](phases/stage-iii-second-playtest.md). Earlier foundational matrices remain coverage references; they do not require repeated player signoffs for already confirmed opening mechanics.

**Status: Binding test criteria.** Stage design is in the [stage specifications](phases/); engine evidence limits are in the [technical contract](technical-contract.md). This file is an acceptance plan, not a completed test report.

## Evidence discipline

Stage IV Package B has one connected acceptance run after the complete implementation, covering an early, middle and ultimate technology subset, the core economy, upgrades and a combat comparison. Follow [Package B acceptance and runtime risks](phases/stage-iv-package-b.md). No per-technology microtest signoffs are required; static tests do not count as a completed in-game run.

Record design requirements, source-verified patterns, static checks, and reproducible in-game results separately. A static pass is not in-game evidence. For each in-game run record Stellaris build, mod commit, enabled mods, empire class/player-or-AI, seed, route, saves/checkpoints, logs, and screenshots when UI behavior matters.

The reported 4.5.3 playthrough completed Stage-II Chapters 1â€“3, defeated the first hunters and displayed the research options; Chapter 4 opened but its Decisions were missing. It does not establish complete multiplayer, AI, or alternative-path validation. Do not claim an individual check passed without its case-specific evidence.

**Evidence chronology:** The checkpoint descriptions and original failure reports below are historical, not claims that those failures remain on the current main. The Stage-III package reports successful Stage-II main-player-route acceptance on 2026-11-08 at `84aaa4cf72cdc32f6aee6c371178f5fcb8e3693e`. That report is not an independently reproduced full AI/alternative-path/MP pass; all listed edge-case acceptance remains required. See [source notes](research/stage-iii-source-notes.md).

## Stage I acceptance

- Complete all five sections in sequence. Confirm actual exploration triggers discovery; each empire has independent state and staggered entry.
- Verify unresolved wait/objective gates do not progress from calendar time alone and no project or reward is dispatched twice. Prior choices must visibly alter downstream options, risk, or results.
- Complete Missing Expedition with a selected owned Science Ship and scientist. Confirm only the ship that actually completed the project is removed, and rescue/search results are conditional. Exercise cancellation, retry/abandonment, missing target, and ship/leader interruption.
- Confirm First Contamination changes an actual world and economy. Test investigation, containment, neglect, and spread paths.
- Complete the Silent Structure through its four-stage Archaeological Site with staffed Science Ship/scientist and real archaeology callbacks. Confirm investigate, secure, and destroy produce distinct durable results; test missing/inaccessible site recovery.
- Confirm the final report reflects earlier choices. Continue or permanently exit; exit blocks future personal EPOCH objectives and Stage-IV entitlement while existing consequences persist; public Stage-III warnings, physical enemy objects and planetary exposure remain universal.
- Confirm the three Planetary Feature families each allow at most one visible state per planet, cannot be manually cleared, replace prior states on transition, and apply real class-compatible economic effects.
- Verify save/load at objectives and conclusion; organic, Hive, and Machine empires; AI progression; simultaneous independent empires; English/German UI; host/client MP; Vanilla compatibility and optional-mod absence.

## Stage II acceptance: exactly five chapters

1. **Entry / The Scar Wakes:** start the entry interval at the Stage-I continuation choice. No Stage-II dispatch, project, or active situation appears before about five in-game years have elapsed. Verify the signal study uses a real Science Ship project with valid target/scientific participation or the specified paid fallback. Compare outcomes from different Stage-I records.
2. **The First Hunters:** verify the hostile Nullwarden fleet exists in a visible system as a real Stellaris fleet. Military victory is mandatory. Exercise preparation, defeat, rebuilding, retreat and renewed attack. Defense, diversion, resource payment, elapsed time, a missing Fleet target and cleanup must never complete the chapter. Test a direct kill, an allied final blow with active campaign participation, and an uninvolved foreign kill; only actual qualifying combat can persist victory.
3. **The Broken Code:** complete wreck/signal/archive analysis with real targets and science participation. Verify research leads do not grant technology automatically. Test target loss, cancellation, and recovery.
4. **The Second Infection:** interact with the planet-level containment mini-game using actual planet conditions and the shared feature states. Verify the player can inspect state, take actions, receive mechanical feedback, and make follow-up decisions. Confirm it is not only an event-popup chain or abstract meter. Quarantine, research, exploitation, and failure produce distinct immediate economy/stability/feature effects; failure remains recoverable and cannot softlock.
5. **The Network of Silence:** finish the three independent Science Ship projects at distinct actual star systems with clear targets. Verify earlier choices alter later findings/risks and Chapter 5 creates the Stage III handoff. Confirm Stage II stops at Chapter 5, with no further Stage-II finale or ending.

## Cross-stage verification

Test organic, Hive Mind, and Machine Intelligence empires; player and AI; two simultaneous independent campaigns; fresh and prototype-era saves; save/load before/after project callbacks and stage transitions; English/German; host/client MP; Vanilla-only and optional Gigastructures configurations. Confirm targets always belong to the campaign owner, no duplicate reward/fleet/project occurs, failure and missing-object paths remain actionable, tooltips match resource changes, Stage-I features/consequences persist, and fresh logs show no new EPOCH errors. Report incomplete cases as open; do not convert plans or static checks into runtime claims.


## Connected gameplay acceptance for the rebuilt campaign

Use Stellaris 4.5.3 Build-ID 26325427 and the PR head. Start a new Vanilla-only game with EPOCH; complete Stage I normally. Keep checkpoints at its continuation, Stage-II invitation, before the first fight, before containment and before the third station result. Record empire class, seed and enabled mods. No console completion flags are needed for the intended path.

1. Confirm Stage I's existing features, costs and choices. Continue and check that no Stage-II objects appear during the approximately five-year interval. Save/reload during this interval.
2. Complete the scar survey and independent baseline with staffed science ships. Chapter 2 must remain closed until both complete; test an interruption by reassigning the ship.
3. Locate the real hunters. Deliberately retreat/lose an initial engagement, rebuild and attack again. Confirm neither loss nor missing-target recovery reports victory. Then defeat the formation militarily; save/reload before/after the native callback. Verify weapons, actual losses, ship graphics, aggro limits and workable difficulty. Test allied attribution and a foreign-only kill from checkpoint saves.
4. Recover wreck fragments, isolate their signature and perform archive comparison. Test paid secured-telemetry fallback when the location is inaccessible. Research Spectroscopy normally and inspect its building unlock; research must not be granted automatically or required to proceed.
5. Inspect the infection feature and economic modifiers in the planet window. Run quarantine Ã¢â€ â€™ localization Ã¢â€ â€™ sampling Ã¢â€ â€™ stabilization. From a checkpoint, try unsecured sampling/exploitation Ã¢â€ â€™ unstable Ã¢â€ â€™ isolation Ã¢â€ â€™ stabilization, and localization Ã¢â€ â€™ emergency containment. Confirm distinct costs, visible state changes, devastation and permanent emergency damage. Preserve all three Stage-I feature families. Repeat with Hive and Machine perspectives.
6. Complete each of the three independent network projects with staffed science ships in separate systems. One or two results must not finish the stage. Exercise one paid remote measurement, verify reduced precision and costs, then finish. Confirm the story ends after five chapters, with durable military/planet/science records and no automatically started crisis.
7. Inspect fresh `error.log` for new EPOCH errors using the runtime classifier. Existing logs are historical evidence only. Verify pre-entry saves, a new mid-campaign save, a prototype Stage-II save that suspends without rewards/spawns, AI progression, concurrent campaigns and MP host/client save/load separately.

Recovery: use **Resume resonance operations** on the capital. The obsolete Restore objectives situation approach was removed by the Stage-II feedback fixes. Interrupted staffed-ship projects remain assignable; explicit paid archive/remote alternatives reanchor inaccessible objectives. No recovery operation invents a military win. The one paid replacement encounter is permitted only when the real force is absent and no victory was confirmed.

## Automated verification and evidence limit

Run `./scripts/test_epoch_regressions.ps1` and `git diff --check`. The suite keeps Stage-I parsed flow checks, parses Clausewitz nesting/event-option scopes, checks feature families and Vanilla assets, validates DE/EN keys and references, and interprets the actual new callback/decision effects for negative gates, repeated callbacks, foreign targets, damage, research leads and handoff ordering. It is deliberately labeled static; its small interpreter does not model the engine, tactical AI, saving or multiplayer.

The following was the **pre-acceptance feedback checklist**. The later main-player-route report is recorded in the evidence chronology above; these edge cases are not individually certified by it. This includes battle-hook ordering and allied attribution, fleet balance/pursuit, project map presentation and AI assignments, decision UI/economic display, localization substitutions, prototype-save shell loading, persistent target binding and simultaneous MP campaigns. Do not report old `error.log` contents as a clean run of the new implementation.


For the reproduced Chapter-1 blocker, keep the saved post-failure game: install the PR head, reopen the current objective, fund/repeat SCAR with a staffed science ship, then verify `The independent expedition` can be funded, BASELINE appears on the map, and its native completion opens Chapter 2. No console completion flags or inferred success are used. Save/reload after a new project starts to exercise its persistent ship assignment. Check all eight required ship-project result paths with native Country From and the explicit assigned target; check optional reconnaissance separately against its native Planet/PREV Country callback, including lost/reanchored targets and repeated deliveries. A pre-fix already-running project without an assignment must be reissued/repeated.

Separately test Stage I with a Colony-backed campaign world: a newly created Silent Structure must be attached to the physical Planet, all four native stages must still run, and final choices must preserve their existing distinct feature outcomes without an invalid From access. A pre-fix unfinished Colony-bound site should enter the existing real remote-study recovery when the owner-local monthly situation callback runs; it must not gain excavation credit. Completed Stage-I outcomes remain unchanged. Inspect fresh logs for `epoch_res.101`Ã¢â‚¬â€œ`.109`, `epoch_core.43` and Vanilla `ancrel.15050`; historical errors are not a post-fix result.

## PR #13 feedback acceptance

The subsequent [narrative/UI and runtime revision](narrative-ui-overhaul.md) adds the mandatory SCAR automatic-delivery, tooltip-only execution, legacy-site sanitation and spoiler-free finale checks. Test these on the patched PR head; the earlier checkpoint logs do not validate the revision.

See [the correction and checkpoint handoff](stage-ii-feedback-fixes.md) for all ten findings, costs, native source evidence, saved-game recovery and remaining runtime checks. Run `scripts/test_epoch_regressions.ps1` with the target installation and generated script documentation available. The new native-evidence test accepts `EPOCH_SCRIPT_DOCUMENTATION` for another documentation directory.

For the next in-game run, use separate copies of the existing checkpoints:

1. Chapter 4: recover from the capital immediately, verify the named world's seven decisions, gray prerequisites, exact costs and real 60Ã¢â‚¬â€œ90-day completion. Save/load after quarantine and localization; verify those paid steps persist. Check isolation/stabilization and emergency in separate branches, including production and all three independent feature families.
2. Chapter 2 before spawn: verify a real accessible non-capital system, map identification and bounded stationary threat. Include a one-system empire and a closed-border/disconnected route. An existing saved fleet retains its position.
3. Chapter 2 before combat: start 600-point Physics reconnaissance with no ship/scientist, save/load partway, complete it and inspect the 1800-day Ã¢Ë†â€™15% weapon-damage modifier. In a second branch win before research completion: the project must disappear, with no later reward or extra victory.
4. Chapters 1 and 3: compare accessible field targets against blocked targets. Check field research rewards, free resumption of already paid archives and no duplicate charges from stale windows. Compare safe and risky analysis; finish the risky containment path without a softlock.
5. Chapter 5: complete all three projects. Verify no Handoff before Continue, persistent consequences for both final choices, no capital recovery after completion and no later personal mission or Stage-IV entitlement after permanent refusal; public Stage-III crisis exposure is still required. Repeat with AI and two concurrent campaign empires. Capture fresh logs and distinguish EPOCH diagnostics from unrelated mods.

<!-- EPOCH_STAGE_III_DESIGN_V1:testing -->

## Stage III — The Nullwarden Convergence (opening implemented; runtime unverified)

The authorized [first-offensive slice](phases/stage-iii-opening-implementation.md) is implemented and adds `scripts/test_stage_iii.cjs` to the regression suite. Its source/guard checks are static. The full-stage matrix below remains future runtime acceptance; the [new static transcript](research/stage-iii-opening-static-checks-2026-11-08.txt) does not replace any in-game case.

**Design acceptance only.** Use the full [Stage-III acceptance matrix](phases/stage-iii-acceptance.md) and [engine contract](phases/stage-iii-engine-contract.md); no Stage-III results exist yet. This section changes the earlier blanket cross-stage assertion that permanently opted-out empires receive no later EPOCH objects: **a universal physical galactic crisis is a deliberate exception**, while personal storyline, early preparation and personal ascension stay declined.

Required connected matrix:

1. **Clock**: two configured Mid-Game Start Years (for example 2250/2300); 20-year relative preparation only after completed/continued Stage II; universal outbreak near the chosen M even if no empire ever joined EPOCH.
2. **Reach**: all ordinary spacefaring empires, AI and human, organic/Hive/Machine, previously refused, Stage-I-only, prepared/unprepared/uninitiated and newly created countries; exactly one shared global crisis and independent personal records.
3. **Disparity**: uninitiated empire has strictly stronger real initial planetary contamination/scar impact than a comparable prepared empire; existing contained/healed states are not revoked, the three feature families remain exclusive, owners are correct after conquest and save/load.
4. **Reality**: mobile hostile Nullwarden fleets, actual fighting, genuine reachable anchor systems, finite reinforcement tied to living relays, real planetary economic consequences, withdrawal/rebuild and no victory from passage of time.
5. **Resolution**: genuine military destruction; military access plus scientific sabotage; collective objective fulfillment with truthful national contribution. No duplicate victory/reward, no global re-trigger after reload.
6. **Compatibility**: two simultaneous countries, host/client MP, Vanilla Khan/Tempest overlap, no Galactic Community, Optional Gigastructures disabled/enabled, different galaxy sizes, one-colony and no-valid-colony edge cases.
7. **Narrative/UI**: public messages never presume personal Stage-I/II history; narrative only current discoveries; costs/effects natively visible; no Stage, mod, Handoff, hidden variables or future-stage spoilers.

The reported successful player test of Stage II on commit `84aaa4cf72cdc32f6aee6c371178f5fcb8e3693e` is evidence of a connected **main player route only**, not proof of Stage-III implementation, AI/MP compatibility or all alternate Stage-I/II paths.
<!-- /EPOCH_STAGE_III_DESIGN_V1:testing -->

Paket-B-Nachbesserung zu PR #18: [konkrete Belastungsrechnung, Grenzen und genau ein geb�ndelter Ingame-Abnahmelauf](phases/stage-iv-package-b-review.md). Statische Review-Ausgabe: [10.11.2026](research/stage-iv-b-review-static-checks-2026-11-10.txt).
