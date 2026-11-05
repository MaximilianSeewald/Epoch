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
| Situation stages, progress, monthly updates, approaches, outcomes, abort | VERIFIED – SOURCE | `common/situations/99_README_SITUATIONS.txt:40-64`, `:156-190`, `:241-248`; concrete `common/situations/01_narrative_situations.txt:1-146` | Suitable for multi-stage investigation and choice-dependent progress. Monthly per-situation update cost at scale is unmeasured. |
| Situation choices set approaches; triggered situation events use situation scope | VERIFIED – SOURCE | `events/situation_events.txt:89-145` (`situation_event`, `situation = this`, `set_situation_approach`); `:849-916` creates a situation and sets chosen approach | Connect choice events to the live situation; test scope transitions and AI outcomes in runtime. |
| Special project fields and completion callbacks | VERIFIED – SOURCE | `common/special_projects/00_projects_1.txt:2-23` (key, costs, requirements, event scope, success/fail); `:116-145` (event chain and follow-up events) | Projects fit discrete research tasks; use success callback to continue event/situation flow. |
| Project availability effect exists in supplied effects | VERIFIED – SOURCE | `common/scripted_effects/02_machine_age_effects.txt:1617`, `enable_special_project` definitions | Source pattern supports activating a defined project from other script. Exact parameters and scope depend on the specific definition. |
| AI setup and autonomous progression | UNVERIFIED | Supplied corpus has no complete AI weight/personality directories; selected event fields are not enough to verify broad AI behavior | Add safe AI paths and test with actual AI empires; do not claim parity based on source presence alone. |
| Script values and inline-script definitions | UNVERIFIED | `common/script_values/` and `common/inline_scripts/` are absent; `common/scripted_effects/01_start_of_game_effects.txt` references inline scripts, e.g. line 1596 | Cannot verify reusable script values, inline-script syntax or definitions from this subset. |
| Localisation format/encoding and UI assets | UNVERIFIED | No `localisation/`, `gfx/`, or interface directories in supplied subset | English/German text, key syntax, encoding, and icon/UI requirements need files and in-game validation. |
| Descriptor/Workshop/submod packaging | UNVERIFIED | No vanilla descriptors, external `.mod` files, launcher metadata or Workshop layout supplied | Core and Gigastructures package separation is an EPOCH requirement; dependency fields and load order need launcher testing. |
| Random delay synchronization, MP determinism, save/load, OOS safety, performance | UNVERIFIED | No runtime execution; source text cannot prove these engine properties | Validate on a 4.5.3 host/client session, save/load, and representative galaxy sizes before release. |

## Architecture assessment

**PROPOSED:** first test a country-local `on_game_start_country` handler. It
should filter to appropriate empire types, set a persistent idempotency marker,
then schedule at most one delayed event for that country. The delayed event
should recheck the shared eligibility rule and marker before starting content.
This design does not require a recurring global scan and the source confirms the
per-country hook and delayed country-event patterns. Avoid claiming exactly-once,
randomized staggering, save compatibility, or MP safety until runtime tests pass.

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

Still required when the matching game installation is available: launcher
recognition/activation; parser logs; per-country hook coverage for organic,
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

Proceed to a minimal isolated test mod when ready to perform runtime verification;
the matching installation is present. Keep the first test limited to the country-start hook, one guarded
delayed event, and a source-supported simple situation start. Do not implement
EPOCH gameplay mechanics until the open runtime and missing-source questions are
closed or explicitly accepted by the Technical Lead.
