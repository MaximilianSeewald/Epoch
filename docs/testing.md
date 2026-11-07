# Acceptance and Verification

**Status: Binding test criteria.** Stage design is in the [stage specifications](phases/); engine evidence limits are in the [technical contract](technical-contract.md). This file is an acceptance plan, not a completed test report.

## Evidence discipline

Record design requirements, source-verified patterns, static checks, and reproducible in-game results separately. A static pass is not in-game evidence. For each in-game run record Stellaris build, mod commit, enabled mods, empire class/player-or-AI, seed, route, saves/checkpoints, logs, and screenshots when UI behavior matters.

Current game-playthrough evidence reaches entry to Stage II. It does not establish complete multiplayer, AI, or alternative-path validation. Do not claim an individual check passed without its case-specific evidence.

## Stage I acceptance

- Complete all five sections in sequence. Confirm actual exploration triggers discovery; each empire has independent state and staggered entry.
- Verify unresolved wait/objective gates do not progress from calendar time alone and no project or reward is dispatched twice. Prior choices must visibly alter downstream options, risk, or results.
- Complete Missing Expedition with a selected owned Science Ship and scientist. Confirm only the ship that actually completed the project is removed, and rescue/search results are conditional. Exercise cancellation, retry/abandonment, missing target, and ship/leader interruption.
- Confirm First Contamination changes an actual world and economy. Test investigation, containment, neglect, and spread paths.
- Complete the Silent Structure through its four-stage Archaeological Site with staffed Science Ship/scientist and real archaeology callbacks. Confirm investigate, secure, and destroy produce distinct durable results; test missing/inaccessible site recovery.
- Confirm the final report reflects earlier choices. Continue or permanently exit; exit blocks all future EPOCH objects/dispatches for that empire while existing consequences persist.
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
5. Inspect the infection feature and economic modifiers in the planet window. Run quarantine → localization → sampling → stabilization. From a checkpoint, try unsecured sampling/exploitation → unstable → isolation → stabilization, and localization → emergency containment. Confirm distinct costs, visible state changes, devastation and permanent emergency damage. Preserve all three Stage-I feature families. Repeat with Hive and Machine perspectives.
6. Complete each of the three independent network projects with staffed science ships in separate systems. One or two results must not finish the stage. Exercise one paid remote measurement, verify reduced precision and costs, then finish. Confirm the story ends after five chapters, with durable military/planet/science records and no automatically started crisis.
7. Inspect fresh `error.log` for new EPOCH errors using the runtime classifier. Existing logs are historical evidence only. Verify pre-entry saves, a new mid-campaign save, a prototype Stage-II save that suspends without rewards/spawns, AI progression, concurrent campaigns and MP host/client save/load separately.

Recovery: choose **Restore objectives** in the situation, or **Resume resonance operations** on the capital. Interrupted staffed-ship projects remain assignable; explicit paid archive/remote alternatives reanchor inaccessible objectives. No recovery operation invents a military win. The one paid replacement encounter is permitted only when the real force is absent and no victory was confirmed.

## Automated verification and evidence limit

Run `./scripts/test_epoch_regressions.ps1` and `git diff --check`. The suite keeps Stage-I parsed flow checks, parses Clausewitz nesting/event-option scopes, checks feature families and Vanilla assets, validates DE/EN keys and references, and interprets the actual new callback/decision effects for negative gates, repeated callbacks, foreign targets, damage, research leads and handoff ordering. It is deliberately labeled static; its small interpreter does not model the engine, tactical AI, saving or multiplayer.

All rebuilt mechanics are **untested in game** until the connected acceptance run. This includes battle-hook ordering and allied attribution, fleet balance/pursuit, project map presentation and AI assignments, decision UI/economic display, localization substitutions, prototype-save shell loading, persistent target binding and simultaneous MP campaigns. Do not report old `error.log` contents as a clean run of the new implementation.


For the reproduced Chapter-1 blocker, keep the saved post-failure game: install the PR head, reopen the current objective, fund/repeat SCAR with a staffed science ship, then verify `The independent expedition` can be funded, BASELINE appears on the map, and its native completion opens Chapter 2. No console completion flags or inferred success are used. Save/reload after a new project starts to exercise its persistent ship assignment. Check all nine scientific result paths with native Country From and the explicit assigned target, including lost/reanchored targets and repeated deliveries. A pre-fix already-running project without an assignment must be reissued/repeated.

Separately test Stage I with a Colony-backed campaign world: a newly created Silent Structure must be attached to the physical Planet, all four native stages must still run, and final choices must preserve their existing distinct feature outcomes without an invalid From access. A pre-fix unfinished Colony-bound site should enter the existing real remote-study recovery when the owner-local monthly situation callback runs; it must not gain excavation credit. Completed Stage-I outcomes remain unchanged. Inspect fresh logs for `epoch_res.101`–`.109`, `epoch_core.43` and Vanilla `ancrel.15050`; historical errors are not a post-fix result.
