# B+C production correction after the third player test

Tested input: B `944c3c205b40bb0f3057fbf99015da88ab6133d8`, C `4f8530e135e1889fccda1b6ab52bcc933e39d84c`, Cygnus 4.5.3. The player confirms persistent buildings, real megastructure construction, visible cores and working research/components/traditions/perks. Those successful construction and unlock mechanisms are preserved.

**Production on the new correction commits is not runtime-validated.** No agent-controlled Stellaris process/save was run. Numerical output below is an executable-table projection, never a tooltip or a claim that resources reached the treasury.

## Causes and scope evidence

The [preserved EPOCH diagnostics](../research/third-b-c-playtest-2026-11-10/scope-errors.txt) include actual current/supported scopes. [Provenance and raw-log hashes](../research/third-b-c-playtest-2026-11-10/provenance.json) identify the third run separately from the first-run artifacts.

| Block | Execution context used by the correction | Evidence / consequence |
|---|---|---|
| Factory job base output | Unconditional job economic table; no owner/deficit predicate | Native physicist and technician_drone base outputs are unconditional. Job eligibility and filled workforce still determine output. |
| Mega `potential` | Country | Native construction contract; the player confirms construction succeeds. Preserved. |
| Mega `build_menu_potential` | Fleet; `from` = country | Native contract; preserved. |
| Mega `possible` | System; `from` = country | Native contract and successful player construction; preserved. |
| Mega resource `cost` | Construction country; no scoped predicate here | Native contract, paid construction already succeeds. |
| Mega `resources.produces` | Megastructure; `owner` = country | Third-run errors explicitly report `epoch_iv_future_research` → `is_country_type` executing in megastructure scope at lines 12/52/81/110/149/177 and UAP philosophy branches. Country predicates must be inside `owner`. |
| Mega `resources.upkeep` | Native recurring resource table, unconditional | No owner/flag condition is needed. No claim of an independently logged conditional-upkeep scope; resource amounts remain native. |
| Mega `triggered_country_modifier.potential` | Country | Third-run errors explicitly report root `has_megastructure_flag` executing in country scope at lines 38/67/96 and UAP modifier lines. Country conditions are direct; instance flags must be inside `any_owned_megastructure`. |
| `on_build_complete` | System; `from` = country; `fromfrom` = instance | Native callback contract; the successful build path is preserved. |

The previous validator assigned the two recurring contexts backwards and therefore certified a broken implementation. The native megastructure README also describes produces as country scope, contradicting this actual engine run. Runtime diagnostics take precedence; that comment is no longer accepted as the oracle. Native Shroud Seal's owner-qualified recurring output is consistent with the observed megastructure context.

For factories, the suspicious implementation placed **all** core production behind an added three-input `has_deficit` guard. The third log contains no factory scope error. Native job sources use owner-qualified conditional bonuses, so it would be incorrect to claim that `owner` is categorically invalid in job economics. The exact reason this guard suppressed production in the player's save is not isolated. The correction removes that entire conditional base-output dependency for both organic and Hive/Machine jobs, keeping the native unconditional 12 cores per 100 workforce and unconditional paid input table. Full Factory I/II therefore project 36/72 cores. Only a real treasury delta can confirm the factory diagnosis.

Deficits now follow native resource deficit situations/bankruptcy and inherited job modifiers. There is **no promised immediate zero-stockpile hard stop**. Inputs remain 18 minerals +3 alloys +8 energy per 100 workforce, plus the factory building's 4/8 energy. No script adds free cores or refunds inputs.

## Upkeep and icon correction

| Family | Fixed cores I / II / III |
|---|---|
| Lab / Forge | 2 / 4 / 6 |
| Collector / Archive / Academy | 1.5 / 3 / — |
| Institute / Phase | 1 / 2 / — |
| Factory bootstrap exception | 0 / 0 / — |

Job core upkeep remains additional. All seven staffed consumer families together cost 11.18 cores at tier I and 26.64 at top tiers. The model now sums all separate upkeep tables; the old helper missed Forge's later core-upkeep table.

[Small/medium/large monthly core ledger, including fleets, edicts, Wilderness and C infrastructure](../research/third-b-c-playtest-2026-11-10/core-economy.md), [full JSON](../research/third-b-c-playtest-2026-11-10/core-economy.json).

The icon keeps its 32/64px DDS canvases and cyan/amber identity. Geometry shrinks to 48% about the center. Alpha area falls from 569.835 to 131.686 physical pixels; visible bounds fall from 30×28 to 14×14. Installed Dark Matter / Crystals / Gases measure 152.816 /120.475 /95.690 alpha pixels and visible bounds 17×14 /15×14 /11×15. SVG/PNG/DDS and all eight generated resource-modifier textures share the updated geometry. [Equal-pixel-scale visual comparison](../research/third-b-c-playtest-2026-11-10/core-icon-comparison.png): Dark Matter, Crystals, Gases, old EPOCH, new EPOCH.

## Minimal smoke test: actual resource deltas

Use the existing genuine post-story save with healthy input stocks. Record stockpiles **and** monthly ledger lines; account for other income/consumers. Avoid instant_resources or any script that injects cores.

1. **Factory I → II:** staff organic or Hive variant fully (300 →600 workforce). Advance a complete month at each tier; verify +36 →+72 gross cores and −54/108 minerals, −9/18 alloys, −28/56 energy including the building, before modifiers. Disable/re-enable the factory to isolate its ledger contribution. Reload and repeat one month.
2. **Nexus I:** complete the already-working normal construction; verify actual monthly +200 physics, society and engineering research, +4 gross cores, −2 core /−40 energy upkeep. Saving/loading must preserve the monthly contribution. Research is a flow, so verify field income/progress, not a nonexistent research stockpile.
3. **Forge I:** verify actual +100 alloys /+20 cores and −400 minerals /−60 energy. Upgrade once only if needed to confirm replacement: output doubles, rather than tier I stacking with tier II.
4. **One short failure/control check:** pause staffing to eliminate factory output; separately test a deficient mega owner and recovery, then inspect fresh EPOCH scope diagnostics. Compare the smaller icon in the resource summary. Record treasury deltas and fresh error/game logs against the final commit SHAs.

Remaining uncertainty: factory guard's exact false condition in the player save, native shortage/default timing, recurring modifier refresh, ownership/cap refresh, real monthly production/upkeep and reload behavior. No further feature package is included.
