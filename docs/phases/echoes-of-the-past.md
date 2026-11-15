# Echoes of the Past

Implemented on `feature/epoch-02-echoes-of-the-past` for [PR #32](https://github.com/MaximilianSeewald/Epoch/pull/32). Static/model checks are recorded below. No game was launched for this revision; engine, AI playthrough, save/load and multiplayer acceptance remain unverified.

## Selection and independence

Each eligible empire receives **one independent persistent draw per story**: Ghost Signal 35%, Unquiet Colony 30%, Last Relay 20%. The `rolled` flag is written before its draw; a negative result is never rerolled by later surveys, colonies, years or save/load. Existing started stories are not drawn again. Selection is separated from placement: winners wait for a suitable opportunity during the existing early campaign window. Actual occurrence can therefore be lower than these selection probabilities, never higher through repeated opportunities. With adequate targets, the probability of selecting none is `0.65 × 0.70 × 0.80 = 36.4%`; selecting all three is `0.35 × 0.30 × 0.20 = 2.1%`.

Initial placement delays are 180/540/1,080 days, followed by at least 120 days between discoveries. Ghost placement uses an actually surveyed non-colonizable body. Colony selection considers only eligible owned colonies. Relay placement uses owned starbases and surveyed, non-colonizable system bodies. A missing target does not cause another percentage roll or a galaxy search. Once all draws are negative or placed, the discovery handler stops at its flag guard. No story completion starts another story, gates the main campaign, or excludes another personal side story.

## Player actions and balance

| Story | Actions and real consequences |
|---|---|
| Ghost Signal | A visible native derelict appears at the surveyed body. A staffed Science Ship traces it for 90 days. Careful recovery takes 180 days; forced recovery takes 60 days, costs 250 energy/100 alloys, and has a 35% chance to require 90 days of stabilization. The archive grants 180 Society/120 Physics Research and five years of +3% Physics production exactly once. Its manifest then opens a **120-day staffed cargo salvage project** at a surveyed neighboring body, another local body, or finally the wreck itself. Preserved records recover 250 alloys/350 minerals; forced extraction recovers 150 alloys/200 minerals. No free technology or scripted loss of the Science Ship. |
| Unquiet Colony | A persistent visible −5% job-output/−2 stability disturbance requires active treatment. **One regular decision** opens a compact strategy event. Containment costs 250 energy/150 minerals and takes 60 days. Research costs 200 energy/100 alloys and takes 120 days, then grants 180 Physics/180 Society Research and +5% local Physics output for ten years. Exploitation costs 100 energy/50 alloys and takes 45 days: 65% yields 150 alloys/150 energy and +5% local job output for five years; 35% leaves persistent −10% job output/−5 stability until repaired. Every treatment retains the original disturbance and adds −2% job output while facilities are occupied. Organic, hive and machine descriptions/states differ; actual job-output effects also apply to lithoid and other economies. |
| Last Relay | An independently discovered physical relay in an owned surveyed system is investigated by a staffed Science Ship for 90 days. The player can awaken and actually destroy two defenders, or complete a staffed technical project: 180 days normally, 90 with an archive **or** colony containment/research, **45 with both**. After security, choose paid activation, one-time salvage for 150 alloys, or permanent deactivation. Final choices revalidate and claim completion before any payment/reward, including duplicate windows/callbacks. |

### Colony visibility and lifecycle

The normal maximum is **one simultaneously visible side-story decision per affected colony**: investigate before treatment, none during treatment or after a clean resolution, or repair only after a real backlash. Repair costs 200 energy/100 minerals and takes 60 days. Its `potential` requires the actual backlash modifier; there is no bill for an expired effect. The baseline disturbance and new backlash do not expire while their task is pending. Only the treatment modifier is temporary; its saved completion callback still resolves if the modifier expires first. Conquest or colony loss removes this story's active treatment/backlash, without touching protected Stage I–IV states or rewarding either owner. Annual AI handling selects only affordable treatments; native decision AI also handles the entry and repair.

### Physical relay infrastructure

`common/megastructures/epoch_echoes_relay.txt` defines script-spawned dormant, active, permanently disabled and stripped objects using existing Vanilla sensor-array entities/portrait. These are native map objects with their own economics, not country modifiers. Activation costs 300 energy/150 alloys. The active object produces **6 Physics Research per month with 4 energy native monthly upkeep**. Production requires the original personal owner, system ownership, no energy deficit, at least four energy in stock and no permanent campaign refusal. Capture stops output immediately and converts the captured object to a cost-free disabled shell on the following day, without overwriting the conqueror's personal targets. Native structure UI offers an irreversible 30-day shutdown, with an AI weight for energy deficits/negative income. Dormant, disabled and salvaged shells have no output/upkeep. Structure construction does not block other megastructure construction. Recurring production uses the same optional-owner query pattern as the repaired Stage-IV infrastructure; instance flags are evaluated only inside owned-megastructure scopes, with a one-active-relay cap during ownership transitions. All implicit build/outliner sprites and structure-detail localization keys are registered using native assets.

The deliberately small implementation uses **bounded scientific production**, without a local sensor aura: the available sources do not establish a safe small-station local sensor implementation for 4.5.3. No global sensor modifier, free country-wide research multiplier, GUI override, new ship/station framework or DLC/mod dependency is introduced. The former temporary country-modifier definition survives only as an inert old-save key and is removed during migration.

## Callback safety, recovery and performance

- Ship projects save their assignment on the performing ship, pass it explicitly in the callback and verify scientist, actual project country, destination and open story. Failure/cancellation resolves a country or its owner and calls only that story's recovery. If a native failure scope supplies no owner, the original empire's annual recovery remains authoritative.
- Ghost completion is unrelated to relay state. Reward flags are set before the grants; cargo retrieval and relay finalization have their own replay guards. Colony treatment clears its active flag before granting an outcome.
- Ghost/relay can each reissue missing work at most twice, with a 180-day retry guard and a maximum of twelve active annual checks. Destroyed ships, lost scientists, invalid/unreachable targets or ignored choices do not cause replacement ships, targets or defender respawns. An unreachable assignment can therefore time out without a reward.
- The military callback requires the exact owner-tagged defender fleet, its native destruction callback and a combatant fleet. A missing defender, retreat or cleanup is not a victory. Failure/refusal clears combat-pending state before removing its own fleet.
- Colony treatment is saved native delayed work, not a self-repeating event. The yearly handler operates only on actual active personal stories and saved targets. Completed infrastructure uses native economy/AI and ownership callbacks, with no permanent upkeep pulse event. No monthly/global planet, fleet or empire scan was added.
- Permanent campaign refusal rejects queued work/rewards, hides decisions and stops relay output immediately; the next annual cleanup closes projects and removes remaining personal penalties. A guarded one-time migration carries earlier PR assignments forward and prevents a second archive reward. Target loss during migration can still close a legacy story without reward.

## Static acceptance and version evidence

Required checks:

- `node scripts/test_release_ci.cjs`: all 11 commands pass, including the nested release regression. The existing SteamCMD shell test skips on this Windows host without Bash.
- `node scripts/test_epoch_echoes.cjs`: 615 source/model checks (641 with the optional installed-source audit); source contracts and bookkeeping models cover eight draw combinations, 10,000 repeated opportunities per combination, serialized flags, Ghost completion with/without an existing relay, callback ownership, isolated recovery, all colony visibility flag combinations, treatment replay, persistent infrastructure, economic guards, military success, AI and localization references. This is not a navigation/economic/combat simulator.
- `git diff --check`: passes.

Additional local checks: the installed-source Echoes audit, `test_clausewitz_structure.cjs`, `test_resonance_vanilla.cjs` (33 checks), `test_stage_iv_runtime_contracts.cjs` (630 checks), and `test_stage_iv_c_runtime_contracts.cjs` (619 checks) pass against the available 4.5.4 installation. Source-only CI covers the existing Stage-I flow and Stage-II contracts.

The historical `test_stage_iii.cjs` fails its old immutable-file assertion for the shared on-actions file (the earlier PR already adds Echoes hooks there). `test_stage_iv.cjs` fails its explicit installed-4.5.3 version assertion. Those suites were not weakened to manufacture a pass. They do not constitute current full Stage-III/IV acceptance. The normal CI suite and current runtime-contract regressions above pass.

**Target: 4.5.3. Available installation: Cygnus v4.5.4 (1b4f). No complete 4.5.3 source tree is available.** Native examples confirmed in the available source include script-spawned megastructure ownership/position (`events/biogenesis_crisis_events.txt`), resources/upkeep/conditional production and non-blocking construction (`common/megastructures/22_shroud_seal.txt`), sensor-array entities (`02_spy_orb.txt`), derelict ambient objects and colony/fleet/ownership callbacks. Existing generated script documentation confirms the spawn/remove/flags/scopes used here; native staffed project assignment follows the previously observed Stage-II callback pattern.

For reproducibility, inspected local source SHA-256 hashes:

| Vanilla file | SHA-256 |
|---|---|
| `common/megastructures/02_spy_orb.txt` | `a298a2ea333cd991b2aa38271f58a84f764fbd4e5f5e0196a9a6bb7123fbbc86` |
| `common/megastructures/22_shroud_seal.txt` | `08d1112ae898d68d33ce5a509f657e886cfb7085dae199e81cde80cd52983a5b` |
| `common/on_actions/00_on_actions.txt` | `b85054a739808e7e9e213bb4d189fed1eeb930e8f16c9b36bdfdbe82ce59fe1f` |
| `common/ambient_objects/ambient_objects.txt` | `e6a4cff46a910da18e26708ea3221e225aac359fb23dbb44fb319baab9613ea0` |
| `events/biogenesis_crisis_events.txt` | `c7b1e3854654b3d772de3e1e9ef1daf2d21de2d51d20a4c581da163a299ba0e7` |

The Shroud Seal file matches the hash recorded in the repository's historical 4.5.3 research note, confirming that particular source example is unchanged; it does not verify the full 4.5.3 interface. Unverified engine risks remain native relay production/ownership/shutdown behavior, failure callback scopes, autonomous AI project assignment/targeting, rendering, legacy saves, long campaigns, save/reload timing and multiplayer synchronization. No static success is presented as an in-game playthrough or a request that the user individually test every new mechanic.
