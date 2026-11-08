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
- No new start origin/civic/free start bonus or discovery technology. Stages I/II use no global singleton campaign state or foreign personal targets. Stage III alone owns one galaxy-wide crisis; personal history and rewards remain country-local (see [ADR-001](architecture/adr-001-galactic-crisis.md)).


## Stage-II implementation source review

The local installation still reports Build-ID 26325427. Additional inspected patterns:

- `common/on_actions/00_on_actions.txt`: `on_fleet_destroyed_victim` uses victim Country / From combatant Country / FromFrom victim Fleet / FromFromFrom combatant Fleet. Combat-join attacker/defender hooks are Fleet scoped. `on_space_battle_won` also fires on emergency FTL/disable, so it is not used as destruction proof.
- `common/country_types/00_country_types.txt`: guardian-style countries (for example `origin_dragon`) disable strategic AI but use a non-neutral faction, basic technology, exclusive diplomacy and event modules. This supports deliberately scripted tactical fleets; it does not demonstrate EPOCH hostility/pursuit behavior.
- `events/an4_events.txt`, drones.110: aggressive fleet stance, `set_aggro_range_measure_from = return_point` and bounded aggro range.
- `common/special_projects/documentation.txt`: scientist/Science Ship requirements, visible location, country-scope abort/failure and ship-scope completion. Its generic claim that From is the location does not describe the observed EPOCH call chain. `00_projects_distant_stars.txt` forwards `from = from`, while `02_projects_astral_planes.txt` forwards `from = fromfrom`; neither alone proves EPOCH's destination scope.
- `common/situations/02_strategic_situations.txt`: approach `on_select`; actual progress is changed by effects, not by EPOCH's zero monthly progress.
- `common/decisions/02_special_decisions.txt` and building examples: native decision enactment/cost/effect/AI fields and building resources/prerequisites. Event pictures, feature assets, ship components, graphical culture, building art and reactor references are checked against the installation.

The military review rechecked `00_on_actions.txt` against Build-ID 26325427: the victim destruction hook is Country scoped (From = opponent Country, FromFrom = destroyed Fleet, FromFromFrom = opponent Fleet); both join hooks are Fleet scoped, with From the opposing primary fleet and optional additional fleet slots. `aquatics.300`/`.310` demonstrate join callback fleet access. `on_fleet_exit_battle` is documented to fire once for each exiting fleet, through victory, defeat or any other exit; `nomads.510` demonstrates its Fleet event. These source files do **not** establish the ordering between exit and destruction callbacks, and no battle ID is supplied by these documented hooks. A surviving participant's `is_in_combat` at the last kill is consequently not treated as reliable evidence.

The revised proof binds native join participation to the actual hostile fleet and its system. Exit marks a boundary but defers disposal one day; the next join resets the old record immediately. Native destruction plus direct involvement or that engagement's proof is still mandatory. Target recovery uses independent, campaign-keyed country/fleet identities and validates scope types (`is_scope_type` is demonstrated in `envoy_events.txt`); an explicit recovery-only search replaces lost references without granting victory. Static permutations exercise exit-before-destruction, destruction-before-exit, stale/spatially wrong records, repeated callbacks and lost/foreign/dead targets. They do not prove engine callback ordering, destroyed-object lifetime, join coverage, same-day dispatch completion, delayed-event save/load or multiplayer behavior. These remain required runtime checks. The script interpreter is not a Stellaris runtime.


The first Stage-II runtime test established `Wrong scope for trigger is_owned_by`, Current Scope = Country, in `epoch_res.101`. EPOCH enabled these projects in Country scope; forwarding `from = from` preserved a Country, not a planet. All nine science callbacks now preserve that native Country for comparison with the performing ship's `owner`. Each project's native `on_start` snapshots its owner-keyed destination into a project-specific, performing-ship-keyed persistent event target. Native `on_success` explicitly supplies that snapshot as FromFrom; no assumption is made about native FromFrom. The callback checks owner, chapter, one-time result, assignment identity, the current campaign destination, destination type (Planet or Colony), required local ownership and the performing ship's system. It consumes the assignment only on a valid success. Failure/cancel/recovery never grants success.

The generated 4.5.3 `script_documentation/triggers.log` excludes Country from `is_owned_by`'s supported scopes. `scopes.log` distinguishes Colony and physical Planet and documents `planet` from Colony. `effects.log` says `create_archaeological_site` associates the exact current scope object; it supports Colony, but that does not provide a site's Planet link. The inspected save stores EPOCH world targets as Colony, consistent with the old code creating sites directly there. Vanilla `ancrel.15050` expects From = Site and accesses `From.planet`; the observed failures at lines 91/113/131 follow from that Colony association. New sites are created inside the owned world's `planet` scope, while economy/features remain on the owned world. Final Stage-I choices use checked saved site targets rather than a possibly expired From and reject repeated choices. Unfinished legacy EPOCH sites without a Planet link are retired by owner-local monthly recovery into the existing real remote-study/closure route; completed outcomes and working sites are preserved. No Vanilla event file is overridden.

Regression fixtures now pass native Country From through the actual project `on_start`/`on_success` definitions for all nine paths, reject the original Country-as-Planet trigger, and distinguish Colony from Planet in archaeology. Snapshot reanchors, foreign countries, wrong chapters, repeated callbacks and model save/load are covered. This is still static interpretation. The corrected native start/success snapshot, explicit scope overrides, project map display and legacy-site recovery require a new in-game run; the old error log proves the original failures, not success of this fix.


## PR #13 feedback evidence (4.5.3)

The [feedback correction handoff](stage-ii-feedback-fixes.md) supersedes the earlier nine-science-ship description: eight required projects retain their ship-bound callback proof, while optional reconnaissance now follows Vanilla `AMOEBAS_PACIFICATION_PROJECT` (600 Physics points, no ship, `planet_event`, `location = no`, PREV Country forwarding). Generated scope/effect/trigger documentation confirms distinct Planet/Colony identities and shared carrier flags; the seven Decisions use country-keyed carrier flags rather than direct target identity. `test_resonance_vanilla.cjs` reads the installed sources and generated docs and verifies the native callback, scope promotions, UI assets and localization syntax. This is source evidence, not runtime acceptance.

<!-- EPOCH_STAGE_III_DESIGN_V1:technical-contract -->

## Stage-III global-crisis engine contract (design gate; not validated)

The Stage-III [specification](phases/stage-iii-military-crisis.md), [ADR-001](architecture/adr-001-galactic-crisis.md) and [engine validation plan](phases/stage-iii-engine-contract.md) introduce a **single global threat**, unlike the owner-local Stages I/II. **Do not retrofit global state into Stage I/II.** Galaxy activation cannot require `epoch_res_stage_iii_ready`; that flag controls *early private preparation* and later personal entitlement only. All ordinary spacefaring empires, including permanent private-story opt-outs, must physically experience the crisis; uninitiated countries receive stronger authentic planetary effects. Global shared facts (live enemy/anchors, military victory) and country-local history/rewards must be modeled separately.

The intended start is relative to the *configured* midgame year: preparation at **M−20** only for Stage-II-complete continuers, universal outbreak **around M**, even with no participants. Verify actual 4.5.3 native expressions and supported contexts for the configured midgame year and a pre-M offset. Installed `marauder.151` and `syndaw.400` provide source evidence for negative comparisons (`>= -10`); exact -20/0 timing, hook delivery and save/MP behavior remain untested. The [evidence register](phases/stage-iii-engine-evidence.md) records the distinction. No fixed-date fallback is part of the plan.

Technical work must first prove, with native source and actual test: idempotent galaxy coordinator (including MP host/client); non-neutral **mobile strategic** Nullwarden fleets (not only Stage-II static tactical aggro); genuine anchor objects and bounded reinforcement shutdown; legitimate movement/war and planet/Colony owner scopes; full-economy effects with exclusivity across existing feature families; and combat/coalition credit without speculative callback ordering. All Gigastructures integration remains optional and separate. Add no Vanilla crisis override or global campaign-completion shortcut.

The binding [Stage-III acceptance matrix](phases/stage-iii-acceptance.md) distinguishes source evidence, simulated regression and actual EPOCH runtime evidence. None is currently claimed as passed for Stage III.
<!-- /EPOCH_STAGE_III_DESIGN_V1:technical-contract -->

The [ADR-002 integration policy](architecture/adr-002-stage-iii-integration.md) is normative: protect active Stage-I/II objectives and contained/controlled/studied/healed states; use a genuine supplementary modifier when no conflict-free family placement exists; do not reuse old infection/mission setters as a global API. Safe placement may delay activation; v1 automatic first initialization must be before M. Source-supported global dispatch does not imply an exposed host-only command.
