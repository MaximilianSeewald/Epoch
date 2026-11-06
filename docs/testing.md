# EPOCH validation plan and M0-B results

The Phase I acceptance matrix is defined in
[`phases/phase-i-first-contact.md`](phases/phase-i-first-contact.md). The
existing regression script checks static patterns for all five sections, an
owner-keyed expedition vessel and route, randomized loss/recovery outcomes,
contamination and structure effects, class-specific permanent consequences,
in-world conclusion text, AI decision weights, missing-object fallbacks,
owner-keyed target usage, enrollment hooks, localization, and script references.
These checks do not demonstrate that the campaign works in game, or prove the
expedition's full runtime life cycle, AI completion, multiplayer safety, or
save/load persistence.

## Phase I milestone: 6 November 2026

The five sections now use fixed research/wait pairs and native `on_first_enter`
callbacks. Open wait objectives have zero monthly progress. The callback is
also dispatched monthly as a guarded save/load fallback; it never resolves a
project or grants progress. The main description stays fixed; native
`triggered_blocked_desc` identifies the currently required action.

| Research stage | End / objective release | Wait stage | Required resolution | Wait end |
|---|---:|---|---|---:|
| `stage_signal_analysis` | 15 | `stage_echo_resolution` | `epoch_core_first_echo_complete` or explicit `epoch_core_echo_second_abandoned` | 20 |
| `stage_source_analysis` | 25 | `stage_expedition_resolution` | Expedition/search result report: `epoch_core_expedition_phase_resolved` | 30 |
| `stage_contamination` | 35 | `stage_contamination_resolution` | Sampling, isolation, or explicit acceptance of damage: `epoch_core_contamination_phase_resolved` | 40 |
| `stage_excavation` | 45 | `stage_structure_resolution` | Chapter 4 choice or explicit missing-site recovery: `epoch_core_structure_phase_resolved` | 50 |
| `stage_report` | 55 | `stage_conclusion_resolution` | Final continuation/sealing decision: `epoch_core_conclusion_decision_resolved` | 60 (never approached automatically) |

The final decision closes the Situation immediately on either path and records
`epoch_core_phase_i_situation_complete`. Continuing preserves readiness for
future content; sealing records permanently opts out. Both remove the active
Phase I state and retain lasting consequences. No Phase II gameplay is started.
Monthly steps are smaller than each five-point wait stage, so a threshold
overshoot cannot jump past an unresolved objective. Exact displayed progress
may exceed a threshold by part of a monthly step.

The original two-project First Echo flow, expedition performing-ship callback,
and four native archaeology chapters/difficulties remain in use. Expedition
failure, recall and search loss remain explicit outcomes. All actual
non-survivor expedition losses now contribute to later consequences. The
contamination uses class-specific planet modifiers; it persists until sampling,
paid isolation or explicit acceptance. A deterministic closing assessment
incorporates Echo, expedition and contamination records as well as the existing
structure outcome. English/German stage, objective and outcome text is complete.

Failure/cancellation windows have persistent one-shot guards. Missing target
objects or a conquered site request explicit recovery/closure instead of timed
success. Closing removes pending projects after recording the resolution, so
cancellation callbacks cannot reopen them. The native archaeological site is
saved under a country-keyed target; excavation and visibility cannot select a
different empire's site. Native excavation stages, rolls and chapter callbacks
remain the same. Invalid site-to-country modifier switches now use the saved
campaign world.

Run the complete static suite with PowerShell 7 and Node.js:

~~~powershell
./scripts/test_epoch_regressions.ps1
git diff --check
~~~

The PowerShell suite includes `scripts/test_phase_i_flow.cjs`, which parses the
actual Clausewitz progress/dispatcher blocks. It explores all approaches,
quarter-point boundary offsets, complete paths with approach switches,
abandonment, both initial methods, and repeated dispatch with restored country
flags. This is a limited static model, not an engine emulator or actual
save/load validation. Historical log summaries are labelled pre-fix evidence.

The user reports the initial Situation, monthly approach progress, stable
description, First Echo wait gate and both project unlocks, and multistage
archaeology as successfully tested. The expanded campaign still requires one
complete runtime acceptance pass. Follow the
[German acceptance checklist](testing/phase-i-acceptance.md). Fresh 4.5.3 parser
logs, AI project assignment/completion, real save/load, empire variants, UI and
multiplayer remain runtime checks. Existing saves already beyond a skipped
objective are not automatically rewound; use a new game or a pre-discovery save.

Diagnostics remain off by default. Console `event epoch_core.49` toggles monthly
stage/progress/project logging for investigation. No global monthly country
pulse or elapsed-time completion is introduced.

See the [source evidence matrix](evidence/m0-b-engine-verification.md) for
historical evidence and the source references below for this milestone.

## M0-B performed checks

| Check | Result | Evidence |
|---|---|---|
| Repository state | Branch is `research/m0-engine-verification`; pre-existing untracked `.codegraph/` left untouched | `git status --short --branch` |
| Vanilla reference inventory | 168 supplied `common/` and `events/` files plus the manifest (169 files total); all 168 data files SHA-256 match the corresponding installed files | [Per-file hashes](evidence/m0-b-source-sha256.csv) |
| Install/build metadata | `stellaris.exe` present at `G:\Steam\steamapps\common\Stellaris`; Steam appmanifest shows App-ID 281990 and Build-ID 26325427 | [Evidence and VersionInfo](evidence/m0-b-engine-verification.md#runtime-test-results) |
| Source review | on_actions, events, situations, special projects, scripted effects/triggers/variables inspected | See matrix and line anchors |
| Static parse test | Not run | A parser/runtime test was not attempted |
| In-game/runtime tests | Not run; game launch not attempted and no temporary test mod created | Runtime is installed; its launchability and behavior remain unverified |
| Multiplayer/performance | Not tested | Requires runtime tests, including a host/client session |

The requested target is Stellaris 4.5.3, App-ID 281990, Build-ID 26325427. These
were user-provided target details. The installed Steam appmanifest corroborates
App-ID and Build-ID, but neither the script files nor their hashes prove game
version. The reference data matches the installation byte-for-byte by SHA-256.
No tests changed Vanilla files. No gameplay content was added.

## M0-B completion status

- **Source-Level-Research:** complete for the supplied files and documented in
  the evidence matrix.
- **Runtime verification:** open. The installation and executable are present;
  Codex did not attempt to launch the game, so no runtime claim is made.
- **AI, UI, localisation, and packaging:** more source files and/or launcher/game
  checks are required.
- **Multiplayer and performance:** runtime tests are required.

## Runtime validation matrix for implementation

| Configuration | Required |
|---|---|
| Stellaris 4.5.3, EPOCH Core only | Yes |
| Stellaris 4.5.3, EPOCH + Gigastructures | Yes, for compatibility package |
| Organic, Hive Mind, Machine Intelligence | Yes |
| Player and AI empires | Yes |
| English and German | Yes |
| Multiplayer host/client | Before release |

## Runtime checklist

- [ ] Launcher detects and activates Core and optional submod as separate items.
- [ ] Game logs show no parse errors for each package/load order.
- [ ] Country start hook covers intended empires without initializing invalid country types.
- [ ] Guarded delayed discovery is delivered once and remains safe after save/load.
- [ ] Timing is individually staggered using an MP-safe mechanism.
- [ ] Situation start, stage progress, approaches, completion, failure, and abort work.
- [ ] Special project prerequisites, progress, completion, and failure work.
- [ ] AI reaches a safe progression path with no artificial start bonuses.
- [ ] All three empire classes can use the shared progression.
- [ ] English/German text, UI, and icons render correctly.
- [ ] Core loads and functions without Gigastructures.
- [ ] No avoidable global polling; performance is measured at representative sizes.
- [ ] Host/client behavior has no reproducible desyncs.

Static source review does not substitute for these runtime checks.

## Phase II Block A implementation note

The Chapter 1–3 implementation, migration boundaries, gameplay limitations,
and static validation scope are recorded in
[`phases/phase-ii-block-a-implementation.md`](phases/phase-ii-block-a-implementation.md).
