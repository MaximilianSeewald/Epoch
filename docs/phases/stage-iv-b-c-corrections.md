# B+C correction report — first 4.5.3 playtest

The first player run on `cf13857ebbd277c02faed11cc35a6e29b66bb7f4` supersedes the earlier optimistic static acceptance language. The preserved [error log](../research/first-b-c-playtest-2026-11-10/error.log.txt) and [game log](../research/first-b-c-playtest-2026-11-10/game.log.txt) are **pre-correction evidence**, never evidence that the new code ran successfully.

## Package B

- All eight tier-I `potential` blocks formerly tested absence of their own family. Those tests now live in construction-only `allow`; upgraded tiers retain the native `can_build = no` chain and `planet_limit = 1`. No new destroy/abort logic. Completion/key, colony and Wilderness gates remain.
- The engine rejected root-level job `icon` / `building_icon`. Building presentation now uses native `swappable_data.default`; all sixteen implicit `job_epoch_*.dds` exist. Eight economic-category names, sixteen bonus-workforce modifier names, economic modifier textures and DE/EN labels resolve.
- Protocol Core art is an original deterministic vector UI mark: amber core inside a cyan circuit frame. SVG source, PNG preview and three RGBA DDS sizes are checked in, reproducible with `node scripts/build_epoch_core_icon.cjs`. The rare resource's technology visibility is valid, but the native resource group enumerates every resource. The narrow `interface/resource_groups/topbar_other_resource_groups.txt` override adds exactly one list item; no whole GUI/topbar replacement. This is an intentional compatibility point for other mods editing the same group.
- Five paid B decisions now expose native `tooltip = { add_modifier ... }` effects outside their completion guard; the actual effect remains in `hidden_effect` with the original safety conditions. Lithoid previews branch exactly like execution. Costs/time remain native decision fields.
- Factories output 36/72 cores fully staffed, with paid industrial inputs, no core bootstrap loop, no market conversion, and production suspended on input deficits. Wilderness uses paid 1–6 node scaling shared by startup cost, upkeep and output. Saved labor is priced at twice the staffed inputs.
- The seven other families gain stronger local output or functions. No blanket empire output multiplier was added. [All 18 tiers, four staffing profiles, monthly net ledgers and installed-Vanilla source hashes](../research/stage-iv-b-corrected-balance.json), with [comparison tables and scenarios](../research/stage-iv-b-corrected-balance.md).

Validation: Package-B suite 4,380 assertions; observed-runtime contracts 610; full existing regression runner 711 checks, all passing at the B correction commit. The new suite deliberately rejects old self-blocking building and unsupported-job fixtures. The log classifier now rejects implicit missing textures, unknown mega sprites and unlocalized generated modifiers. Historical logs still correctly fail the runtime gate.

The bounded condition model exercises building absence/presence/upgrade and serialization over repeated ticks; **it does not run Stellaris**. Actual construction persistence, UI loading, production and multiplayer remain unverified until the compact smoke test below.

## Package C

- Resource production triggers now execute as country triggers: no mega flag and no owner switch in country resource tables. Operational instance flags remain only in valid mega-scope modifier/access checks. Native documentation and the actual Wrong Scope diagnostics take precedence over the misleading Shroud-Seal example previously used by the suite.
- Both capped-family counts now use native `count_owned_megastructure = { count < 2 limit = { OR = { ... } } }`. Country reservation writes are removed; no generic empty-system test rejects the unfinished custom shell. Menu uniqueness and completed-instance construction checks are separate from persistent eligibility. Upgrade stages do not reapply first-instance checks.
- Completion sets the flag on `fromfrom` and marks its planet; cancel/complete clean obsolete reservation flags without reading them. Dismantle cleanup only releases empty anchors. Ownership and duplicate shutdown are evaluated live. Simultaneous queued construction and callback removal order remain runtime risks.
- All ten stages register implicit build/outliner sprites pointing to installed native artwork, and keep native entity/construction/portrait assets. Every stage has a distinct DE/EN story name plus explicit tier count.
- Both C decisions now preview native positive modifier/deposit effects while retaining guarded execution. Class, owner, diagnosis and stabilization checks remain.
- Four trees and five perks have stronger, bounded class/philosophy roles. Class/perk gates equal the player-tested commit; no new slot limits, forced species conversion or story changes. [Nine comparisons, all 28 tradition choices, five perks and ten megastructure ledgers](../research/stage-iv-c-corrected-balance.md), [machine-readable values/source hashes](../research/stage-iv-c-corrected-balance.json).

C validation: 2,474 content assertions and 208 targeted scope/count/lifecycle/UI contracts, including negative fixtures for the reported invalid resource/count patterns. Production numbers are calculated expectations after scope correction, not an assertion of native execution.

## Compact combined smoke test

Use the final C branch (which includes corrected B), the existing mod and a genuine post-Leviathan save; no new test mod or feature package.

1. Build one tier-I building per family, staff it, advance three month ticks, save/reload, upgrade it, tick again. The original and upgraded building persist; a second family instance on the same colony is unavailable. Start an additional queued duplicate to check the native cap at completion.
2. Open the native rare-resource summary: Protocol Core icon, stockpile and monthly balance appear. Verify Factory I/II 36/72 before bonuses, all three industrial inputs, and actual net upkeep. On Wilderness, check node scale/cost symmetry and input deficit suspension.
3. Start each of the three megastructures, observe at least one progressing day, complete stage I, tick for real output and upgrade once. Check an initial cancellation/rebuild; test ownership transfer and dismantling with completed structures. Verify capped Nexus/UAP and multiple Forges.
4. Check all sixteen job icons, build/outliner/portrait images and five B / two C decision previews. Native effects must show the actual modifier and duration; a changed owner/class/diagnosis at completion must not bypass guards.
5. Compare a fully staffed EPOCH lab/forge against the documented Vanilla buildings on equal-modifier worlds; inspect real monthly net, not just tooltip base output. Compare the documented representative fleet's core load. Save fresh `error.log` / `game.log`; run `node scripts/test_stellaris_runtime_log.cjs <fresh-error.log>` and distinguish foreign diagnostics.

No further feature work before those runtime blockers are demonstrated fixed. Save/load with conquered structures, native construction queue races, UI scaling/mod compatibility, automatic staffing, deficit update order and multiplayer remain runtime risks even when static contracts pass.
