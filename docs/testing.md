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
2. **The First Hunters:** verify the hostile Nullwarden fleet exists in a visible system as a real Stellaris fleet. Exercise military victory, active diversion, prepared defense, and costly withdrawal from separate saves. Persist the actual outcome. Popup choices and time passage alone cannot resolve the chapter.
3. **The Broken Code:** complete wreck/signal/archive analysis with real targets and science participation. Verify research leads do not grant technology automatically. Test target loss, cancellation, and recovery.
4. **The Second Infection:** interact with the planet-level containment mini-game using actual planet conditions and the shared feature states. Verify the player can inspect state, take actions, receive mechanical feedback, and make follow-up decisions. Confirm it is not only an event-popup chain or abstract meter. Quarantine, research, exploitation, and failure produce distinct immediate economy/stability/feature effects; failure remains recoverable and cannot softlock.
5. **The Network of Silence:** finish Science Ship projects at multiple actual star systems with clear targets. Verify earlier choices alter later findings/risks and Chapter 5 creates the Stage III handoff. Confirm Stage II stops at Chapter 5, with no further Stage-II finale or ending.

## Cross-stage verification

Test organic, Hive Mind, and Machine Intelligence empires; player and AI; two simultaneous independent campaigns; fresh and prototype-era saves; save/load before/after project callbacks and stage transitions; English/German; host/client MP; Vanilla-only and optional Gigastructures configurations. Confirm targets always belong to the campaign owner, no duplicate reward/fleet/project occurs, failure and missing-object paths remain actionable, tooltips match resource changes, Stage-I features/consequences persist, and fresh logs show no new EPOCH errors. Report incomplete cases as open; do not convert plans or static checks into runtime claims.
