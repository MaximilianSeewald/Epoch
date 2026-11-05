# M0-C Stellaris 4.5.3 runtime probe

## Status and evidence labels

- **SOURCE** means present in the local 4.5.3 source files inspected for M0-B; it is not a runtime result.
- **IMPLEMENTED** means the test files are in this repository; it does not mean the game accepts them.
- **PARSER ACCEPTED** means logs from a Stellaris 4.5.3 run were checked and show no relevant parse errors. No such log evidence has been provided for this record.
- **OBSERVED IN GAME** means the tester confirmed the behavior in Stellaris 4.5.3. The tester reported that runtime tests were performed successfully, but supplied no case-by-case details.
- **NOT TESTED / NOT SPECIFIED** means no result for that particular check was provided, so this document cannot claim it was tested or passed. It does not contradict the general report of successful runtime testing.

## Setup and installation

**IMPLEMENTED:** isolated content lives in `test-mods/m0-c-runtime-probe/`. It has its own descriptor, event namespace (`epoch_m0c`), on_action file, situation, and English localisation. It does not reference EPOCH Core, Gigastructures, or modify Vanilla files.

1. Copy the `m0-c-runtime-probe` directory to `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\mod\m0-c-runtime-probe`. Keep its internal `descriptor.mod` in place.
2. Create the sibling launcher descriptor `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\mod\m0-c-runtime-probe.mod`. It repeats the metadata in the copied folder's `descriptor.mod` and adds a `path` to the copied folder. Keep `name`, `version`, `supported_version`, and `tags` in both descriptors in sync. Use the following content, replacing the path with the full path to the copied directory (forward slashes are recommended):

   ```text
   name="EPOCH M0-C Runtime Probe"
   version="0.1.0"
   supported_version="4.5.*"
   tags={ "Utilities" }
   path="C:/Users/<WindowsUser>/Documents/Paradox Interactive/Stellaris/mod/m0-c-runtime-probe"
   ```

3. In the Stellaris launcher, enable only **EPOCH M0-C Runtime Probe** in a test playset. Start the installed game through Steam and confirm the main menu reports 4.5.3. User-confirmed installation: `G:\Steam\steamapps\common\Stellaris`, App-ID 281990.
4. Start a new, small test galaxy with an organic player empire and AI empires. **The only enabled mod must be EPOCH M0-C Runtime Probe. Keep EPOCH Core and every other mod disabled.** Make a backup before each save/load test.

## Implemented script structure and source checks

- `common/on_actions/epoch_m0c_on_actions.txt` declares only an `on_game_start_country` handler that queues `epoch_m0c.1`. It does not restate Vanilla's handler list. **Whether this is additively merged is NOT SPECIFIED by the tester's report.**
- `events/epoch_m0c_events.txt` uses the unique namespace `epoch_m0c`. Event `.1` uses a persistent country flag as an idempotency gate, sets it before scheduling event `.2` for 30 days later, and adds no resources or empire setup changes. Event `.2` has a second persistent flag gate, shows a recognizable popup, then starts the probe situation in the current country scope.
- `common/situations/epoch_m0c_situations.txt` defines `category = neutral`, `situation_log_category = developments`, initial progress 0, two stages (50 and 100), and fixed monthly progress with `base = 25`. Completion records a country flag and destroys the situation. This gives a visible progress bar and an automatic, simple completion path if the game accepts and runs the definition.
- The descriptor and localisation are private to this probe. No icons/assets are added. Both former `GFX_evt_unknown` references have been replaced by `GFX_evt_black_hole`. **SOURCE:** `interface/eventpictures.gfx:1349` defines `GFX_evt_black_hole`, and Vanilla uses it in `common/situations/01_narrative_situations.txt:627` (`situation_gravity_well`). No exact `name = "GFX_evt_unknown"` declaration was found in the local `interface/eventpictures.gfx`.

**SOURCE (local Stellaris 4.5.3 export):** `common/situations/01_narrative_situations.txt`, `situation_gravity_well` lines 626–675, contains `category = neutral` together with `situation_log_category = developments`, `initial_progress`, `progress_direction = monodirectional`, and stage definitions. In the same file, `situation_living_snow` lines 132–145 shows `monthly_progress = { base = 5 }` and a nested modifier using `add = 5`; `situation_mysterious_labyrinth` lines 151–165 uses `monthly_progress` with a nested `add = 2.5`. `common/situations/01_overlord_situations.txt`, `shroudwalker_spy_network` lines 226–264, shows a `monthly_progress` base value of 12.5 and `on_progress_complete` calling `destroy_situation = this`. `common/situations/03_origin_situations.txt`, `situation_shroud_forged` lines 1–45, also has `category = neutral`, `initial_progress`, and stages. These are concrete source-pattern matches; the export has no `monthly_progress` value of exactly 25 using either `base = 25` or `add = 25`. The probe keeps `base = 25` by analogy to the Vanilla `base` field, but its exact parser acceptance and behavior remain unverified. `start_situation` is present in `events/situation_events.txt` lines 40–50 (M0-B source copy) and the country-root pattern still needs runtime verification. None of these source matches proves parser acceptance, hook merge behavior, or runtime behavior.

## Test cases and expected observations

Record the game date, empire name/ID, government type, player/AI status, enabled mods, and the precise result for each run. Repeat with fresh saves; flags intentionally make a country run once per save.

1. **Launcher and parser:** the launcher lists and enables the standalone descriptor. Start a new game, exit, then inspect `Documents\Paradox Interactive\Stellaris\logs\error.log` and `game.log` (or the active user-data path shown by the launcher). Record whether the mod's files are loaded, all parse errors/warnings with file and line, and whether Vanilla `on_game_start_country` behavior remains present. Expected: descriptor recognized and no probe-file parser errors. **RESULT NOT SPECIFIED.**
2. **Additive hook / baseline:** on a fresh save with the probe enabled, observe the starting day: the delayed M0-C popup must not appear that day. Advance 30 in-game days; expected: exactly one M0-C popup appears after the delay. Vanilla country-start behavior (for example starting origin setup) must remain in effect in parallel. Compare a no-mod control save for Vanilla behavior. **Additive registration and timing result NOT SPECIFIED.** A missing or mistimed popup alone cannot distinguish a rejected/overridden hook from a parser, trigger, or event issue; use logs and the control run.
3. **Idempotency / repeated handler:** the probe has no test-only re-entry control that can safely replay the normal on_action dispatch path. Do not use `event epoch_m0c.1` or `event epoch_m0c.2` as proof: the console command may invoke an event without evaluating its normal `trigger` conditions, so it does not establish that the flag guards were executed. Static inspection shows `.1` tests `epoch_m0c_started` before setting it and scheduling `.2`, and `.2` tests `epoch_m0c_delivered` before recording delivery and starting the situation. A fresh-game observation can establish the ordinary path runs, but it cannot prove behavior under a repeated normal dispatch. Reliable repeat-dispatch idempotency therefore remains an explicit open limitation; no extra on_action or polling mechanism is added. **Repeated-dispatch result NOT SPECIFIED.**
4. **Country coverage and context:** repeat new games for a normal organic empire, a Hive Mind, and a Machine Intelligence; separately observe AI empires. Expected: each country that receives the Vanilla hook gets its own single delayed popup and its own situation attached to that country. No bonuses or country setup changes should appear. Record each class separately. **Empire/AI coverage result NOT SPECIFIED.**
5. **Delay and situation:** on a fresh save, record the date of game start and popup. Expected: one popup after 30 days, a situation visible under the same empire in the situation log, two stages (0–50 and 50–100), progress +25 monthly, completion after four monthly progress applications, then situation removal and `epoch_m0c_situation_completed`. **Delay/situation result NOT SPECIFIED.** Exact date tick semantics may make the visible calendar date differ by one day; record observed ticks.
6. **Save/load before delayed event:** save after new game has started but before the 30-day event. Reload and advance past the delay. Expected: one popup and one situation, without duplicate scheduling. **Pre-event save/load result NOT SPECIFIED.**
7. **Save/load after popup and during active situation:** save once after event `.2` and once while the situation is active. Reload each save and continue to completion. Expected: no duplicate popup/situation; the active situation retains stage/progress/owner and completes once. **Post-event/active-situation save/load result NOT SPECIFIED.**

## Results log

**OBSERVED IN GAME (tester-reported, general only):** the tester confirmed that runtime tests were conducted successfully. No individual test cases, tested empire types, dates, log excerpts, or save/load results were specified, so this report does not attribute success to any particular check below.

| Check | Status | Observed result / evidence |
|---|---|---|
| Files implemented in repository | IMPLEMENTED | This directory and the isolated probe files listed above. |
| Runtime test campaign (overall) | OBSERVED IN GAME (tester-reported) | Tester confirmed runtime tests were performed successfully; individual scenarios and evidence were not specified. |
| Launcher recognition / activation | NOT SPECIFIED | No case-specific result was provided. |
| Parser acceptance | NOT SPECIFIED | No case-specific result or `error.log` / `game.log` excerpt was provided. |
| Additive `on_game_start_country` registration | NOT SPECIFIED | No case-specific result or Vanilla-control comparison was provided. |
| Delayed event | NOT SPECIFIED | No case-specific timing/result was provided. |
| Idempotency under repeated normal dispatch | NOT SPECIFIED / OPEN LIMITATION | No case-specific result was provided; the current probe has no reliable replay harness, and console event invocation does not prove trigger conditions ran. |
| Situation ownership, progress, completion | NOT SPECIFIED | No case-specific result was provided. |
| Organic / Hive / Machine / AI coverage | NOT SPECIFIED | No empire-type or AI-specific result was provided. |
| Save/load checkpoints | NOT SPECIFIED | No checkpoint-specific result was provided. |

For future detailed records, keep copies of `error.log` and `game.log` from each run, plus the save files and a short observation record, outside this repository or attach redacted copies under `docs/testing/results/`. Record the game build shown by the game/Steam for each run. A parser acceptance claim requires a clean log review; a case-specific observed behavior claim requires direct in-game confirmation tied to that case.

## Open questions and limitations

- Did Stellaris merge the mod's on_action entry with the Vanilla handler list, or replace that entry? The general runtime confirmation did not specify this outcome; do not infer the answer from the source file alone.
- Were all situation fields and the exact `monthly_progress` value `base = 25` accepted and applied as written in 4.5.3? Vanilla source demonstrates the fields/patterns but not this exact value; no parser logs were provided.
- Repeated-dispatch idempotency is not directly testable with the present minimal probe. A future test-only re-entry mechanism would need to exercise the same guard and scheduling path without becoming a production hook or poller.
- Does this hook execute for each country class and AI empire, and how does it behave on a loaded game? The tester did not specify coverage.
- Are country flags and queued country events persisted at the save/load checkpoints? The tester did not specify which checkpoints were run.
- No multiplayer safety, synchronization, performance, or release-readiness claim is made.
- The four-month completion expectation assumes the monthly +25 applies from an initial 0 without extra startup progress. Confirm the actual UI and date in game.

## Runtime file references

The expected Windows user-data log locations are `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\logs\error.log` and `game.log`. Launcher configuration can redirect the user-data directory. Attach the actual paths and unmodified logs to the results record. **No runtime logs from the tester have been provided or stored in this repository.**
