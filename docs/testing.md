# EPOCH validation plan and M0-B results

See the [M0-B evidence matrix](evidence/m0-b-engine-verification.md) for
source-level findings, status definitions, limitations, and open questions.

## M0-B performed checks

| Check | Result | Evidence |
|---|---|---|
| Repository state | Branch is `research/m0-engine-verification`; pre-existing untracked `.codegraph/` left untouched | `git status --short --branch` |
| Vanilla reference inventory | 168 supplied `common/` and `events/` files plus the manifest (169 files total) | `C:\Users\Maxim\Desktop\EPOCH_M0B_Source\file_manifest.csv` |
| Source review | on_actions, events, situations, special projects, scripted effects/triggers/variables inspected | See matrix and line anchors |
| Static parse test | Not run; no 4.5.3 parser is provided in the source bundle | Runtime unavailable |
| In-game/runtime tests | Not run | Game executable absent from the three standard Steam paths checked; no temporary test mod created |
| Multiplayer/performance | Not tested | Requires an installed 4.5.3 runtime and host/client session |

The requested target is Stellaris 4.5.3, App-ID 281990, Build-ID 26325427. The
manifest does not independently attest the dataset's version/build provenance.
No tests changed Vanilla files. No gameplay content was added.

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
