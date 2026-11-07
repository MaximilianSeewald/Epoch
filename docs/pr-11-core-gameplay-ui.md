# PR #11: Shared gameplay and UI foundation

## Review corrections

- The next real-log review found the direct cause of the namespace failure: three EPOCH event `.txt` files had acquired a UTF-8 BOM, so Stellaris rejected the event tables at byte zero and then reported the event IDs as cascades. The Clausewitz test had hidden this defect by stripping `\uFEFF` before parsing. It now rejects BOMs at byte level; localization `.yml` files are separately required to retain their BOM.
- Corrected the Phase II suppression option's situation scope, restored a valid conditional reward branch in the Nullwarden defense event, and moved the five Block C planet modifiers/devastation effects out of `limit` trigger blocks. The parser now checks sibling `if`/`else_if`/`else` structure as well as balanced scopes.
- Updated both Phase II buildings to use Vanilla's `building_sets` and `resources = { category = planet_buildings cost = { ... } upkeep = { ... } }` structure, preserving the 600-mineral costs and existing energy upkeep. The Nullwarden now uses installed Vanilla's `fallen_machine_empire_01` culture and `COMBAT_COMPUTER_LINE_DEFAULT` component template.
- Added the missing situation type, monthly tooltip, description and chamber-recovery keys in English and German. Every raw Phase II stage identifier also has a localized name that points to its existing player-facing stage tooltip.
- Added `scripts/test_stellaris_runtime_log.cjs`. It reports EPOCH root errors, event-table cascades and foreign/Vanilla/Workshop diagnostics separately. The normal regressions run its synthetic classifier self-test; pass an actual fresh `error.log` to gate a real run. Historical logs are evidence of the pre-fix defect and are expected to fail this gate.

- Fixed the malformed scope in `epoch_core_migrate_planetary_features`: its nested `OR`/`root` limit was missing a close, and a trailing close had masked that error by nesting subsequent scripted effects. The new lexer/parser parses every `.txt` under `common/` and `events/`, checks balanced strings/comments/braces and verifies all scripted-effect definitions are unique top-level blocks.
- Stellaris 4.5.3's installed `common/deposit_categories/00_deposit_categories.txt` declares `deposit_cat_blockers` with `blocker = yes`. Its `common/deposits/01_blocker_deposits.txt` includes blocker-category deposits using `triggered_planet_modifier`. EPOCH uses that category and pattern, zero natural spawn weight, vanilla deposit icons, and no clear/swap/resource-time fields. `all_blocker_swap_types` is omitted because these are event-added state markers, not generated blockers. The source confirms the category and syntax; only an in-game check can confirm the final panel placement, refresh timing, and current-owner reevaluation.
- State-specific deposits now show eight contamination states and three scar states. Setters clear the prior variants before adding the next; contamination and scar have separate clear/set paths. One state definition supplies each logical feature's economic effects, including the existing Phase I penalties carried into Phase II. Organic, Hive, and Machine branches each use their own production resource. State changes retain the original numeric economy values.
- All fixed and conditional immediate resource effects in the Phase I, Phase II, and Block C event options now sit in visible option effects, outside `hidden_effect`. Conditional branches retain their original limits, so costs, rewards, and balancing are unchanged and cannot execute twice. Option-name parenthetical resource/stability notes were removed. Campaign flags, project dispatch, and other technical follow-on effects remain in hidden effects where they do not control a visible resource branch.
- English and German names/descriptions now identify each feature state. The situation stages use `custom_tooltip` keys, matching the installed Vanilla situation-stage pattern; the static audit verifies those keys in both languages. Feature state keys, event references, and Stage tooltips are checked for DE/EN coverage. The localization files retain UTF-8 with BOM.
- Research, building, deposit, and event art references were checked against installed Vanilla definitions and sprite files. No custom art was added.

## Static checks

Run from the repository root:

```powershell
./scripts/test_epoch_regressions.ps1
git diff --check
```

For the next in-game run, analyze the newly produced log separately:

```powershell
node ./scripts/test_stellaris_runtime_log.cjs "$env:USERPROFILE/Documents/Paradox Interactive/Stellaris/logs/error.log"
```

An old log is useful only to confirm that the classifier recognizes the known failures; it cannot pass acceptance for this change.

The suite passes 625 static regression checks, including the Phase I model, Phase II transition/recovery models, and the Clausewitz structure and UI audits. These checks validate source structure and installed Vanilla examples; they do not prove runtime behavior in Stellaris.

## Five-point in-game acceptance

Use Stellaris 4.5.3 with EPOCH Core only. Test a fresh campaign with an organic empire, Hive Mind, and Machine Intelligence, and repeat the UI checks in English and German.

1. Confirm the two event-added features appear in the Planetary Features / Blockers panel and that their economic effects match the active state and empire class.
2. Confirm contamination and scar can coexist on one planet, each appears once, and each state change replaces the previous row and applies its economic effect once.
3. Confirm fixed and conditional event resource changes are visible in the option effects and that the stockpile changes once by the amount shown; check that stability changes remain clearly described as campaign outcomes.
4. Confirm technology, building, blocker, project, and event art displays without missing-texture placeholders.
5. Confirm Situation stage labels, approaches, event titles, descriptions, options, and tooltips render correctly in English and German, including umlauts and punctuation.

Record screenshots and a save for each empire class and language. Any failure blocks merge. Do not merge before the player confirms this smoke test.

## Runtime assumptions not yet confirmed

- The installed source supports the selected blocker category and triggered modifier syntax. Blocker-tab placement and immediate economic re-evaluation after state/owner changes still require the in-game acceptance above.
- No in-game smoke test was run during implementation. The genuine error log used to diagnose these fixes predates them and is not evidence for this branch.
- Compatibility conversion is idempotent for owned planets reached by the existing Phase II recovery event. Fresh saves remain the acceptance baseline; legacy saves with missing or foreign references need direct playtesting.
