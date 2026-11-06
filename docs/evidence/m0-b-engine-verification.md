# M0-B Stellaris 4.5.3 engine verification evidence

**Target requested:** Stellaris 4.5.3, Steam App-ID 281990, Build-ID 26325427.
**Inspected path:** `C:\Users\Maxim\Desktop\EPOCH_M0B_Source`.
**Dataset identification:** the supplied reference directory is
`C:\Users\Maxim\Desktop\EPOCH_M0B_Source`. It has 168 game-data files under
`common/` and `events/`, plus `file_manifest.csv` (169 files total). The manifest
lists absolute local paths and byte lengths; it does not identify a game build.
The complete installation at `G:\Steam\steamapps\common\Stellaris` was readable.
All 168 manifest-listed game-data files were found under the corresponding
relative paths and matched the installation by byte length and SHA-256. Per-file
hashes are recorded in [`m0-b-source-sha256.csv`](m0-b-source-sha256.csv). The
manifest itself is an inventory file, not a Vanilla file. No Vanilla files were
copied into EPOCH.

**Version/build provenance:** Stellaris 4.5.3, Steam App-ID 281990, and Build-ID
26325427 were supplied by the user as the target. Steam metadata at
`G:\Steam\steamapps\appmanifest_281990.acf` identifies App-ID 281990 and Build-ID
26325427 for the installed copy. This corroborates the installed Steam metadata;
neither the build ID nor 4.5.3 is proven by the script-file contents or their
hashes alone.

The EPOCH implementation has since moved from the generated expedition-vessel
prototype described by some historical rows below to a player-assigned native
Special Project, and now defines its own native archaeology site. Rows marked
as Vanilla patterns remain evidence about engine scripts; they do not describe
the current EPOCH implementation unless stated explicitly.

## Status definitions

- **VERIFIED – SOURCE:** the named pattern or definition is present at the cited
  path and lines in the supplied local dataset. This says nothing by itself about
  parser or runtime success.
- **VERIFIED – RUNTIME:** confirmed by a reproducible test in Stellaris 4.5.3.
  No claim in this matrix has this status.
- **PROPOSED:** EPOCH design recommendation, not tested.
- **UNVERIFIED:** evidence is absent or runtime properties remain unknown.

Line numbers refer to the supplied source files and are one-based.

## Evidence matrix

| Area / claim | Status | Vanilla evidence or gap | Meaning for EPOCH |
|---|---|---|---|
| `on_survey_planet` scope and source | VERIFIED – SOURCE | `common/on_actions/00_on_actions.txt:1129-1137` explicitly says a ship surveyed a planet, `Scope = Ship`, `From = Planet`; the hook dispatch list follows. | Use this event for discovery that requires an actual science-ship survey. Do not assume `solar_system`, `owner`, or other scope transitions without explicit evidence/runtime validation. |
| Related `on_planet_surveyed` scopes | VERIFIED – SOURCE | `common/on_actions/00_on_actions.txt:1202-1208` says Root = Planet, From = Country, and can also occur without a ship through intel changes. | This hook alone cannot establish a ship-caused survey. Its planet/country scopes differ from `on_survey_planet`. |
| Ship/fleet/leader creation examples | VERIFIED – SOURCE | `common/scripted_effects/00_scripted_effects.txt:978-1002` contains nested `create_fleet` / `create_ship` and owner assignment; the installed source has more lifecycle examples. | Use the complete installed source for exact patterns; source presence does not itself prove an EPOCH vessel's full runtime lifecycle. |
| Vanilla science-ship design/creation patterns | VERIFIED – SOURCE | Installed `common/global_ship_designs/event_ship_designs_anomalies.txt:150-164` defines an event science design; `events/anomaly_events_1.txt:2884-2920` creates one. | Historical EPOCH prototype ship-design code has been removed. The current expedition uses native project assignment to an existing ship. |
| Vanilla leader creation and ship destruction patterns | VERIFIED – SOURCE | Installed `events/anomaly_events_1.txt:2465-...` contains `create_leader` with class scientist; `common/scripted_effects/02_machine_age_effects.txt:1264` demonstrates `destroy_ship = this`. | These examples establish available engine effects. Current EPOCH does not create an expedition scientist; its callback stores the assigned leader and destroys `this` ship. Post-destruction leader state remains a runtime question. |
| Native project ship and leader requirements | VERIFIED – SOURCE | Installed `common/special_projects/00_projects_1.txt` includes projects with `requirements = { shipclass_science_ship = 1 leader = scientist }`, `event_scope = ship_event`, and ship-event success/failure callbacks; `common/on_actions/00_on_actions.txt` describes the performing ship in the success on_action. | EPOCH uses this native assignment path. The ship callback saves the actual performer; automatic AI assignment and callback behavior after interruption remain runtime checks. |
| Archaeological-site structure and scopes | VERIFIED – SOURCE | Installed `common/archaeological_site_types/99_README_ARC_SITES.txt` documents the site schema and scopes; `00_base_game_arc_sites.txt` contains multi-stage sites. Vanilla event examples use `archaeology = yes` and `set_site_progress_locked = yes`; `events/paragon_events_3.txt` destroys a site by `destroy_archaeological_site = this`. | EPOCH defines a four-stage site with science-ship/scientist requirements and distinct final outcomes. Parser acceptance, UI, AI excavation, and save/load remain unverified. |
| Owner-keyed persistent global event targets | VERIFIED – SOURCE | Installed `common/scripted_effects/nomads_effects.txt:6360-6374` saves and reads `comms_signal_system@root`; `common/scripted_effects/02_machine_age_effects.txt:187` saves `cybercreedspecies@root.owner`, with reads at `:245` and `:452`. | The installed source supports both owner/context key forms used by EPOCH. Concurrent-empire isolation and save/load persistence of EPOCH's specific targets remain runtime checks. |
| Special project enable location and owner fields | VERIFIED – SOURCE | Installed `common/inline_scripts/contracts/FindResourceInternal.txt:45-49` enables a project with an event-target planet location and `owner = ROOT`; its project definition is `common/inline_scripts/special_projects/find_resource_internal_project.txt:2-12`. | EPOCH uses the same location/owner form. This does not prove that the campaign vessel will be selected or that AI will complete it. |
| Unexpected ship destruction callback | VERIFIED – SOURCE | Installed `common/on_actions/00_on_actions.txt:1390-1405` documents `This` as owner of destroyed ship 1, `FromFrom` as ship 1, and defines `on_ship_destroyed_victim`. | EPOCH filters the destroyed ship's flag before recording an unexpected expedition loss. Mod on_action merge behavior and target validity during dispatch remain runtime checks. |
| Assigning a created leader to a fleet | VERIFIED – SOURCE | Installed `common/scripted_effects/00_scripted_effects.txt:1244-1252` creates ships inside a fleet and assigns `last_created_leader`. | Vanilla pattern only; current EPOCH does not create or assign a campaign scientist. |
| Randomized and permanent effects | VERIFIED – SOURCE | Installed event/effect scripts use `random_list`; static modifier definitions include `planet_jobs_produces_mult`, stability, resource output, and other effects. Effects use `add_modifier` with `days = -1`; resource checks use `resource_stockpile_compare` and `has_resource`. | Source supports the syntax patterns used for conditional expedition outcomes, persistent planet scars, and the containment cost gate. Determinism, UI presentation, and persistence in EPOCH save/load need runtime verification. |
| Aborting/canceling a special project | VERIFIED – SOURCE | Installed special-project definitions expose `on_cancel`; country-scope failure/cancel callbacks and `abort_special_project = { type = ... }` are used by Vanilla. | EPOCH no longer schedules calendar fallbacks. Real project failure or cancellation opens a retry/explicit-abandon decision; callback order and object cleanup remain runtime checks. |
| A global game-start hook exists and has no scope | VERIFIED – SOURCE | `common/on_actions/00_on_actions.txt:1-29`, `on_game_start`; `common/on_actions/00_on_actions.txt:80-83` explicitly describes another no-scope hook as “No scope, like on_game_start” | A global hook cannot directly be assumed to be empire-scoped. Avoid a global callback that scans every country if the per-country hook suffices. |
| Country game-start hook dispatches a list of country initialization events | VERIFIED – SOURCE | `common/on_actions/00_on_actions.txt:31-78`, `on_game_start_country` | Strong candidate for country-local bootstrap/eligibility, avoiding a separate global enumeration. Whether a mod can extend this vanilla hook without replacing it, plus exact-once and coverage, requires validation. |
| Event namespace, event ID, event types, trigger-only use, options, immediate/after | VERIFIED – SOURCE | `events/situation_events.txt:5`, `:10-86` (`namespace = situation`, `carrier_event`, `situation.5`, `is_triggered_only`, options and `after`); `:89-145` (`situation_event`) | Reserve a unique EPOCH namespace and use the event type matching the actual root scope. Validate parser and ID collision behavior in game. |
| Situation event starts a situation and stores the result as a target | VERIFIED – SOURCE | `events/situation_events.txt:40-50`, `start_situation`, type, target and `save_event_target_as` | Source pattern links an event to a situation; target scope/lifetime across later events needs explicit testing. |
| Day-delayed country events are used in vanilla | VERIFIED – SOURCE | `events/on_action_events_2.txt:32-34` schedules `action.98` using `days`; `common/scripted_effects/00_scripted_effects.txt:3308` schedules `distar.9000` after 10 days | A delayed event chain is a source-supported design candidate. Randomized delay syntax and timing semantics are not established by these examples. |
| Country enumeration helpers exist | VERIFIED – SOURCE | `common/scripted_effects/00_scripted_effects.txt:77-80` (`any_country`); `:964` (`every_country`); `:133-137` (`random_country`) | Iteration is available in source examples, but per-country hook design can avoid an explicit scan. Costs were not measured. |
| Flags and reusable scripted logic occur in the source subset | VERIFIED – SOURCE | `common/scripted_effects/00_scripted_effects.txt:48-65` (flag parameter examples), `common/scripted_triggers/00_scripted_triggers.txt:35-40` (named trigger) | Shared gates and idempotency markers are plausible. Exact persistence and all parameter/scope rules need runtime validation. |
| MP save-load hook has an OOS warning | VERIFIED – SOURCE | `common/on_actions/00_on_actions.txt:80-83`, comment says `on_single_player_save_game_load` does not run when loading MP saves due to OOS concerns | Do not use this hook as the multiplayer recovery path. This warning is not a general guarantee about other hooks. |
| Mod on_action merge/override behavior | UNVERIFIED | Supplied files show vanilla hook definitions, not mod merge rules or a loaded test mod | Verify how to register an additional handler without replacing vanilla handlers before relying on this candidate. |
| Situation root, owner/target, and log-facing text | VERIFIED – SOURCE | `common/situations/99_README_SITUATIONS.txt:14-36` | Situation is suitable to model long-running state, with explicit attention to scopes and UI text. |
| Situation stages, scriptable ends, approach progress, monthly events | VERIFIED – SOURCE | `common/situations/99_README_SITUATIONS.txt:40-64`, `:156-190`, `:241-248`; installed `common/situations/12_biogenesis_situations.txt:706-711` uses a scriptable `end = { base ... mult ... }`; `01_narrative_situations.txt:124-137` uses `on_monthly = { events = { ... } }`. | EPOCH uses approach-scoped monthly progress, stage-specific scriptable end thresholds, and a Situation event dispatch. Its exact parser and stage re-evaluation behavior remain runtime checks. |
| Situation choices set approaches; triggered situation events use situation scope | VERIFIED – SOURCE | `events/situation_events.txt:89-145` (`situation_event`, `situation = this`, `set_situation_approach`); `:849-916` creates a situation and sets chosen approach | Connect choice events to the live situation; test scope transitions and AI outcomes in runtime. |
| Special project fields and completion callbacks | VERIFIED – SOURCE | `common/special_projects/00_projects_1.txt:2-23` (key, costs, requirements, event scope, success/fail); `:116-145` (event chain and follow-up events) | Projects fit discrete research tasks; use success callback to continue event/situation flow. |
| Project availability effect exists in supplied effects | VERIFIED – SOURCE | `common/scripted_effects/02_machine_age_effects.txt:1617`, `enable_special_project` definitions | Source pattern supports activating a defined project from other script. Exact parameters and scope depend on the specific definition. |
| AI setup and autonomous progression | UNVERIFIED | Supplied corpus has no complete AI weight/personality directories; selected event fields are not enough to verify broad AI behavior | Add safe AI paths and test with actual AI empires; do not claim parity based on source presence alone. |
| Script values and inline-script definitions | UNVERIFIED | `common/script_values/` and `common/inline_scripts/` are absent; `common/scripted_effects/01_start_of_game_effects.txt` references inline scripts, e.g. line 1596 | Cannot verify reusable script values, inline-script syntax or definitions from this subset. |
| Localisation format/encoding and UI assets | UNVERIFIED | No `localisation/`, `gfx/`, or interface directories in supplied subset | English/German text, key syntax, encoding, and icon/UI requirements need files and in-game validation. |
| Descriptor/Workshop/submod packaging | UNVERIFIED | No vanilla descriptors, external `.mod` files, launcher metadata or Workshop layout supplied | Core and Gigastructures package separation is an EPOCH requirement; dependency fields and load order need launcher testing. |
| Random delay synchronization, MP determinism, save/load, OOS safety, performance | UNVERIFIED | No runtime execution; source text cannot prove these engine properties | Validate on a 4.5.3 host/client session, save/load, and representative galaxy sizes before release. |

## Architecture assessment

The current implementation uses a country-local `on_game_start_country`
bootstrap, guarded survey discovery, and native project success callbacks.
The campaign Situation owns five phase gates: the selected approach supplies
monthly progress up to each phase's threshold, while a saved objective flag
lowers that stage's scriptable end. A Situation-owned monthly event bridges to
the guarded missing-site recovery check and updates player-facing wait state;
it never grants progress or resolves a project. Exact-once stage re-evaluation,
new-game/load behavior, AI, save compatibility, and MP safety still require
runtime tests.

The documented monthly progress rates are cautious `2.5/2.5/2/2/1.5`,
intensive `4.5/4.5/4/4/3`, minimal `1.75/1.75/1.5/1.5/1`, and containment
`3` in the contamination phase only (phase order 1–5). Situation energy upkeep
by phase is cautious `2/3/2/3/2`, intensive `5/6/6/7/5`, containment `4`
plus `1` mineral during contamination, and minimal `1/1/1/1/1`. Phase progress
thresholds are `10/20/30/40/50`; when the objective flag is still absent, each
of the first four stage ends gains five points while monthly approach progress
stops at the threshold. Intensive risk checks are one-shot per phase; the
containment buffer refreshes for 30 days while that approach is active.

Use a situation for persistent, multi-stage progression and approaches. Use a
special project for a discrete research assignment; its success callback can
advance the chain. Keep completion, abort, and AI-safe outcomes explicit. Core
must not depend on Gigastructures; the optional compatibility package remains
separate. These package boundaries are EPOCH design requirements, not source
verified launcher behavior.

## Runtime test results

**Runtime status: installation present; game launch not attempted.** At
`G:\Steam\steamapps\common\Stellaris\stellaris.exe`, the file exists and is
44,967,544 bytes. Windows VersionInfo reports FileVersion `1.0`, ProductVersion
`1.0`, ProductName `Stellaris`, CompanyName `Paradox Interactive`; last modified
2026-11-04 14:42:58 +01:00. The `1.0` VersionInfo does not establish the game
release version. Other `.exe` files found recursively in the installation:

| Relative path | Bytes | Last modified | VersionInfo |
|---|---:|---|---|
| `stellaris.exe` | 44,967,544 | 2026-11-04 14:42:58 +01:00 | File/Product 1.0; Stellaris; Paradox Interactive |
| `dowser.exe` | 9,459,320 | 2026-09-22 15:57:09 +02:00 | Not reported |
| `Injector.exe` | 59,392 | 2025-05-03 20:15:41 +02:00 | 2.3.1.0 |
| `launcher-installer-windows_2024.14.exe` | 147,210,504 | 2026-10-06 11:22:50 +02:00 | 2024.14; Paradox Launcher |
| `crash_reporter\binaries\CrashReporter.exe` | 2,752,512 | 2026-04-28 22:05:14 +02:00 | Not reported |

Codex did not launch the game. Therefore this is not a claim that launch failed
or that runtime behavior was executable and verified. No parser, in-game,
situation, project, save/load, AI, MP, or performance test has been run. No
temporary test mod was created; runtime behavior remains open.

Still required: launcher recognition/activation; parser logs; per-country hook coverage for organic,
Hive Mind, and machine empires; delay and scope behavior; situation start,
progress, completion/abort; project start/completion; save/load; AI; host/client
determinism and desync observation; performance at representative empire counts.

## Open questions

1. Does `on_game_start_country` run exactly once for every eligible country and
   how does it behave on new-game initialization versus loaded saves?
2. Which random-delay form is accepted and synchronized in 4.5.3 multiplayer?
3. What are the actual scope and save/load semantics for scheduled events,
   country flags, situation targets, and event targets?
4. Which AI weight/automation patterns are supported for the intended event,
   situation approaches, and project type?
5. What localisation encoding, descriptor dependency syntax, launcher layout,
   Workshop paths, and load-order rules apply in the installed 4.5.3 build?
6. What are the situation/monthly-event and delayed-event costs in a large galaxy?

## Recommendation

Proceed to integrated EPOCH runtime verification when ready. Prioritize parser
logs and a complete campaign for each empire class, then interruption, save/load,
AI, multiplayer, and representative galaxy-size checks. Source and static
regression evidence do not substitute for those runtime results.
