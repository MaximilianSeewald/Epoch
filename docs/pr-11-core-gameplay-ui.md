# PR #11: Shared gameplay and UI foundation

## Technical change report

- Stellaris 4.5.3's installed `common/deposits/01_blocker_deposits.txt` defines `d_mountain_range` as a `deposit_cat_blockers_natural` entry with a native `planet_modifier`. EPOCH now uses two entries in `deposit_cat_blockers`: `d_epoch_resonance_contamination` and `d_epoch_resonance_scar`. Both use vanilla deposit icons (`d_radioactive_wasteland` and `d_city_ruins`) and zero natural spawn weight.
- Planet flags choose each contamination state. The blocker deposit supplies the job-output and stability effects for organic, Hive, and machine owners. One shared entry is reused for the existing Phase II latent, active, unstable, and controlled states, so state changes do not add more feature rows. The scar entry applies the former permanent class-specific scar effects. Independent exacerbation and Phase II crisis consequences remain separate.
- State helpers clear prior state flags and legacy modifiers before applying the next state. The owner-local Phase II recovery callback runs an idempotent compatibility pass over owned planets. It converts saves that still contain the former state modifiers. A fresh campaign remains the acceptance baseline; saves with missing, foreign, or already-discarded legacy deposits may not retain their presentation reliably.
- Technologies now specify installed technology icons; the two buildings use installed research-building icons. Special projects and selected key story events use vanilla event pictures for research, unknown signals, ruins, contamination, and threats. No custom graphics were added.
- `epoch_core.20.b` now applies its energy and mineral cost as an option effect, outside `hidden_effect`, leaving flags and project setup hidden. The remaining Phase II option costs and conditional resource outcomes have not yet been converted across the entire event set; their old localized parenthetical notes remain where needed. Confirming the exact resource panel behavior is part of the in-game check.
- German and English localization gained names and descriptions for both shared features. Existing localization files retain UTF-8 with BOM.

## Static checks

Run from the repository root:

```powershell
./scripts/test_epoch_regressions.ps1
git diff --check
```

The regression suite passed 624 checks, including the Phase I flow model and Phase II campaign models. The installed vanilla source was inspected directly, including blocker definitions, native event option resource effects, special-project pictures, technology icon names, and building icon names. These checks do not prove that the revised feature panel, event resource panel, or save migration behaves correctly in game.

## In-game smoke test

Use Stellaris 4.5.3, EPOCH Core only, a new game, and an organic empire. Repeat feature-state checks with a Hive Mind and a Machine Intelligence. Run once in English and once in German.

1. Start a new Phase I campaign and advance until the contamination decision appears.
   **PASS:** the affected colony shows one `Resonance Contamination` row in the Planetary Features / Blockers area. No duplicate contamination row appears.
2. Open the planet's modifier and job/stability details while contamination is active.
   **PASS:** the displayed economic values match the active state for the empire class; the colony has lower stability and the appropriate food, unity, or energy job penalty.
3. Choose containment, then repeat with study and neglect on separate fresh runs.
   **PASS:** the single row changes to the contained, studied, or worsened state; the old state effect is gone; the new effect matches the selected outcome. Neglect can affect the additional world only once.
4. Complete Phase I and inspect the capital.
   **PASS:** one `Resonance Scar` row appears. The contamination row and scar row coexist where the capital is also the contaminated world. Scar penalties match the empire class and remain after closing/reopening the planet view.
5. Advance to a Phase II controlled and unstable state on a fresh Phase I planet.
   **PASS:** the same contamination row changes state without a second resonance row; research, production, and stability effects match the previous Phase II values.
6. Select the 500 Energy / 300 Minerals containment option.
   **PASS:** Stellaris renders the resource changes in its native option-effect display once, the stockpile changes once, and no manually appended parenthetical cost is needed for this option.
7. Inspect a research technology, both buildings, and the Phase I/II project list.
   **PASS:** each icon renders and is relevant to its entry; no missing-texture icon appears.
8. Advance through the discovery, research, missing expedition, contamination, structure, and military events.
   **PASS:** event art matches the subject (signal, research, expedition, contamination, ruins, or threat), with no invalid GFX reference.
9. Switch between English and German and inspect feature names, event choices, completion report, and Situation stages/approaches.
   **PASS:** no missing keys, internal IDs, replacement question marks, or broken umlauts appear; text fits and reads clearly.
10. Save and reload with both planetary rows present.
    **PASS:** both rows, state flags, effects, and their coexistence persist without duplicated penalties.

Record screenshots and the save file for each empire class and language. Any failed check blocks merge. Do not merge before this smoke test is confirmed.

## Current limits

- No in-game test was run as part of this change. The existing error-log summary printed by the static suite is historical/pre-fix evidence, not evidence for this branch.
- Migration of old modifier states is idempotent for owned planets reached by the Phase II recovery event, but old saves are not the acceptance target. Start a fresh game for sign-off.
- The complete Phase II option resource-display conversion remains outstanding and must be completed before this branch can be considered ready for in-game acceptance.
