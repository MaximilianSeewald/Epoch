# Technical Contract and Engine Evidence

**Status: Binding implementation constraints plus source-verified patterns.** This compact reference carries forward engine and integration information from the removed M0/ADR/PR reports. It is not a claim of EPOCH parser, runtime, save/load, AI, or multiplayer success.

## Evidence labels

- **Source-verified:** pattern appears in the inspected Stellaris 4.5.3 installation (Build-ID 26325427), and the curated 168-file M0-B corpus matched the corresponding installed files by SHA-256. This confirms source presence, not parser or EPOCH runtime behavior.
- **In-game evidence:** the current reported Stage-I playthrough reached Stage-II entry. No full AI, alternative-path, or multiplayer validation is claimed here.
- **Open/unverified:** requires an EPOCH-specific parser or in-game test before implementation/runtime claims.

The M0-C probe produced only a general tester report without case-specific results; it is not evidence for additive hooks, exact-once dispatch, country coverage, save/load, or MP behavior.

The source review did not comprehensively verify AI weights, localization/UI assets, script-value/inline-script definitions, packaging metadata, or runtime cost at galaxy scale. Treat those as implementation/release validation, not established Vanilla support.

## Event and scope rules

- **Source-verified:** `on_survey_planet` uses Ship scope with From = Planet. It is appropriate when discovery must follow a science-ship survey. `on_planet_surveyed` has different scopes (Root = Planet, From = Country) and can also fire after intel updates without a ship; it cannot by itself prove ship-caused surveying.
- **Open/unverified:** whether a mod's `on_game_start_country` handler merges additively, its coverage/exact-once behavior, delayed/random event timing, callback ordering, and save/load behavior. Do not infer these from a Vanilla example or the M0-C report.
- Recheck campaign owner, eligibility, current chapter, and target existence at each callback. Key persistent event targets by their owning empire. Source examples demonstrate owner/context-keyed targets, but EPOCH-specific target lifetime, concurrency, and save/load persistence remain runtime checks.
- Do not use `on_single_player_save_game_load` as a multiplayer recovery mechanism: the installed source comments that it does not run for MP saves because of OOS concerns. Other MP safety needs host/client testing.
- Do not claim scheduling determinism, exact-once delivery, save/load persistence, or large-galaxy performance from source examples alone.

## Special projects and archaeology

- **Source-verified:** project definitions support science-ship and scientist requirements, `event_scope = ship_event`, and success/failure/cancel callbacks. Success dispatches in the performing ship scope. EPOCH can identify the ship that performed a project; lifecycle behavior after interruption or destruction remains an EPOCH runtime check.
- **Source-verified:** archaeology documentation defines `potential`/`allow` in fleet scope with From = site, and `visible` in country scope with From = site. Vanilla examples show staged sites, scientist requirements, archaeology callbacks, locked progress, and site destruction.
- Use a native project for a discrete science task and a situation (or another suitable native mechanic) for a persistent multi-step process. A situation's own monthly progress is an engine-supported pattern; it does not justify recurring galaxy-wide polling. Callback scopes and UI behavior still need target-build validation.
- Cancellation/failure must not masquerade as success. Recovery for missing targets, ships, scientists, or sites must be explicit and owner-local.

## Compatibility, UI, and release requirements

- EPOCH Core contains no hard Gigastructures references and works without the optional compatibility mod. Integration belongs in a separately packaged mod. Dependency syntax, launcher recognition/activation, package boundaries, and load order are not verified by the source corpus and require release checks.
- Provide English and German localization. Use valid Vanilla or original art rather than placeholders. Show actual resource deltas in native option tooltips where supported. Verify feature-panel placement, state refresh, localization, and economic effects in game.
- Require save/load, AI coverage, simultaneous-empire isolation, host/client MP, fresh logs, and Vanilla-only/optional-mod checks. Static/source evidence never substitutes for these acceptance runs.
- No new start origin/civic/free start bonus or discovery technology. Do not use global singleton campaign state or foreign event targets.


## Stage-II implementation source review

The local installation still reports Build-ID 26325427. Additional inspected patterns:

- `common/on_actions/00_on_actions.txt`: `on_fleet_destroyed_victim` uses victim Country / From combatant Country / FromFrom victim Fleet / FromFromFrom combatant Fleet. Combat-join attacker/defender hooks are Fleet scoped. `on_space_battle_won` also fires on emergency FTL/disable, so it is not used as destruction proof.
- `common/country_types/00_country_types.txt`: guardian-style countries (for example `origin_dragon`) disable strategic AI but use a non-neutral faction, basic technology, exclusive diplomacy and event modules. This supports deliberately scripted tactical fleets; it does not demonstrate EPOCH hostility/pursuit behavior.
- `events/an4_events.txt`, drones.110: aggressive fleet stance, `set_aggro_range_measure_from = return_point` and bounded aggro range.
- `common/special_projects/documentation.txt`: scientist/Science Ship requirements, visible location, country-scope abort/failure and ship-scope completion. `common/special_projects/00_projects_distant_stars.txt` explicitly forwards `scopes = { from = from }` to `distar.156`; EPOCH uses the same explicit location forwarding instead of assuming a nested callback's From chain.
- `common/situations/02_strategic_situations.txt`: approach `on_select`; actual progress is changed by effects, not by EPOCH's zero monthly progress.
- `common/decisions/02_special_decisions.txt` and building examples: native decision enactment/cost/effect/AI fields and building resources/prerequisites. Event pictures, feature assets, ship components, graphical culture, building art and reactor references are checked against the installation.

The new battle proof combines the native destroyed-object callback with the dedicated owner/marked fleet and campaign combatant involvement. Object cleanup or a missing target cannot grant success. Destruction callback object lifetime, current-combat flags during allied kills and ordering remain unverified engine assumptions to exercise in acceptance. New science callbacks and planet decisions are statically interpreted from their actual scripts, but that interpreter is not a Stellaris runtime.
