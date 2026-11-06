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
