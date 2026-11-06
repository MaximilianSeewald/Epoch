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

## Expected Phase I project and vessel sequence

1. A science ship completes exactly one First Echo project (`EPOCH_FIRST_ECHO_CAUTIOUS` or `EPOCH_FIRST_ECHO_AGGRESSIVE`). Its ship callback advances the shared situation by one milestone and leaves the ship and scientist in service.
2. The player selects an owned science ship with a scientist for `EPOCH_MISSING_EXPEDITION`. Only the ship whose successful project callback is `epoch_core.12` is saved as the expedition vessel and destroyed; its fleet scientist is saved before that destruction.
3. Rescue, salvage, and survey projects callback to `epoch_core.13`; these are search ships and must remain in service. Failure callbacks and timeouts record a search outcome without deleting any ship. Only a survivor outcome clears the saved expedition scientist's missing marker; other recorded outcomes resolve that scientist as lost.
4. The contamination study is performed by a staffed science ship; success/failure changes contamination and advances the same situation. No unrelated science ship is selected or destroyed by these callbacks.
5. A staffed science ship excavates all four native chapters at the Silent Structure. The site is retained when secured, removed only by the player's explicit destroy choice, and never removed by a calendar timeout. The final chapter decision records the outcome, completes the situation, and opens the closing report.

The sequence above is the expected script behavior. It is not a runtime confirmation. The existing Stellaris log files supplied during regression runs contain EPOCH-related script errors, including an invalid `from.planet` scope switch inside Vanilla's visibility helper when it was called for the archaeological site. This helper has been removed from that owner-only visibility check; rerun the game and review fresh logs after this update before claiming parser acceptance.

The conclusion must apply a lasting path- and empire-class-dependent gameplay
penalty before either choice. Verify that no ordinary expiry or routine event
removes it, and confirm it survives saving and loading. Check conclusion option
text in both languages for in-world wording and confirm all EPOCH events,
situations, projects, and enrollment hooks are suppressed after sealing the
records. Review closing text to ensure the consequences can be visible while
their cause and the larger mystery remain unresolved.

See the [M0-B evidence matrix](evidence/m0-b-engine-verification.md) for
source-level findings, status definitions, limitations, and open questions.

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
