# Stage IV – Short technical feasibility decision (Stellaris 4.5.3)

> **Evidence level:** repository-source review plus a short read-only inspection of installed Vanilla sources and existing generated script documentation; **not a new runtime test**. Date: 2026-11-09. Installed `launcher-settings.json` identifies **Cygnus v4.5.3 (4e91)**. No executable code changed; no new probe, compatibility or testing mod. Local source root: `G:\Steam\steamapps\common\Stellaris`; this workstation path is evidence provenance, not a mod dependency. External references below are background supplied with the plan, not additional validation.

## Installed-source spot check for this documentation PR

- **System insertion:** existing generated `logs/script_documentation/effects.log:691–694` documents `spawn_system` with initializer, jump/distance and hyperlane parameters. Installed `events/ancient_relics_arcsite_events_1.txt:426–450` uses a saved target, named initializer, `last_created_system` and explicit hyperlane repair. `common/solar_system_initializers/special_system_initializers.txt:5–35` defines a central star using `planet = { class = star }` and two optional non-star objects (each count 0–1); this permits a star-only result but does not guarantee an available arena. These patterns support feasibility, not safe Stage-IV placement, reachability or owner isolation. The proposed planet-free rule must exclude **non-star** planet objects; rejecting every `planet` object would also reject the central star.
- **Native capacity:** installed `common/defines/00_defines.txt:1226` sets `ASCENSION_PERKS_SLOTS = 8`, and line 1432 sets `TRADITION_CATEGORIES_MAX = 7`. `interface/topbar_traditions_view.gui:231–235` defines the category grid, while lines 243–277 define the perk container. This confirms the default limits; no safe additive capacity extension without GUI/define overrides was established by this short inspection. Preserve the planned default-slot fallback.
- **Planet transitions:** existing generated `effects.log:34–36` documents `remove_deposit` on a colony carrier or deposit and notes that removal does not fire blocker `on_cleared`; lines 3380–3383 document `add_deposit`. EPOCH's `common/scripted_effects/epoch_core_effects.txt` explicitly clears family deposits and maintains matching state flags. `epoch_iii_buffer_world` in `common/scripted_effects/epoch_convergence_effects.txt` changes crisis modifiers/flags without clearing shared feature families. Stage-IV conversion must reconcile deposits, flags and mission guards explicitly; deposit replacement alone does not prove safe progression or healing.

The generated effect documentation was already present (file timestamp 2026-11-09); it was read, not regenerated. No Stage-IV initializer, combat-phase hook, slot extension, runtime transition or multiplayer behavior was executed or validated. The package decisions below remain future implementation guidance, not authorization to implement Stage IV in this PR.

## Decision A: Planet-free personal Leviathan system

**Known:** Stellaris scripting has `spawn_system` with a solar-system `initializer`, distance and hyperlane parameters. A custom initializer can conceptually describe an only-star system; existing modding sources document the effect, but do **not** prove a particular 4.5.3 initializer, pathing, ownership, collision policy or per-empire serialization works as proposed.

**Design resolution:** prefer reserving an existing reachable, uninhabited **star-only** system with no ordinary planet objects, colonies, colonizable worlds or important foreign assets. For each country, store an owner-keyed reservation and unique guardian identity. Only if source review confirms valid 4.5.3 initializer and insertion should Package A generate an additional system; keep accessibility and map integration explicit. A central star is naturally permitted; "no planets" excludes orbiting planetary objects. Never claim that a pre-existing system is available in every galaxy or that `spawn_system` automatically creates a safe arena.

**Fast checks in existing game files (read-only):** `script_documentation/effects.log` (or generated effect docs) for `spawn_system`, `common/solar_system_initializers/` for initializer syntax and no-planet star systems, and `events/` for the actual trigger/effect scope and saved event targets. Then implement only the selected approach in the main EPOCH mod and test during complete Package-A gameplay. If creation is not provably safe, do not fake it; use eligible existing systems or an explicitly documented fallback.

**Reference:** Stellaris modding effect documentation: `spawn_system = { initializer = ... hyperlane = ... min_jumps = ... max_jumps = ... }` (historical syntax; version check mandatory): https://stellaris.fandom.com/wiki/Effects

## Decision B: Traditions and Ascension Perk capacity

**Known:** normal Stellaris 4.5 offers **7 tradition trees / 8 ascension perks**, with slots unlocked by tradition completion and related mechanics. Existing larger-slot mods alter defines, UI and sometimes scripted variables; this demonstrates feasibility of overrides but also compatibility risk. It is **not** established that EPOCH can safely add native slots within one mod without altering these files or depending on another mod.

**Design resolution:** Stage-IV storyline, personal key, 42 technology eligibility and earned planet healing **must never require vacant tradition/perk slots**. The actual four tradition trees and five perks remain genuine native choices; 3 class perks and 2 exclusive final alternatives cannot all be selected by one empire. Default behavior preserves Vanilla limits. No silent `topbar_traditions_view.gui` or global define overwrite in EPOCH Core. Package C may revisit a limited single-mod capacity mechanism **only after** source evidence and a conscious compatibility decision; otherwise honor native slot availability and document that a full-slot empire cannot gain those optional native choices.

**Fast checks (read-only):** installed `common/defines`, `common/scripted_variables`, `common/tradition_categories/`, `common/traditions/`, `common/ascension_perks/` and `interface/topbar_traditions_view.gui`; inspect Vanilla ascension prerequisite chains and existing free-slot checks. Avoid another mod as testing dependency.

**References:** 4.5.3 planner https://voidpedia.com/en/ascension-planner/ ; 4.5-era slot-mod compatibility notes https://steamcommunity.com/sharedfiles/filedetails/?id=3385410973 ; native Modularity tradition structure https://stellarisdb.com/traditions/modularity

## Decision C: Positive replacement of old planetary EPOCH states

**Known:** EPOCH Stages I–III already use shared feature families, saved flags, planet decisions and explicit `remove_deposit` / `add_deposit` transitions. Native modding examples show deposit replacement, but the correct planet/colony scopes, owners, eligibility and feature lifecycle must be checked in actual 4.5.3 and against EPOCH's own state predicates.

**Design resolution:** classify current state by family → verify original owner, current world, ongoing local mission and previous treatment → spend actual resources/time → remove only the relevant family's prior feature → add one new positive terminal state with permanent owner/world guards → persist conversion status exactly once. Never delete unrelated deposits, auto-treat a foreign planet or reset previously healed/controlled outcomes. If no valid own world exists, allow a paid alternative science/station path for personal chapter completion, **without inventing a positive feature on a world that never existed**.

**Fast checks (read-only):** `common/deposits/`, `common/decisions/`, existing `epoch_iii_buffer_world`, Stage I/II shared feature state management and `script_documentation/effects.log` for `add_deposit/remove_deposit`. One normal Stage-IV test in Package A establishes actual runtime behavior; no stand-alone probe mod.

**References:** effects guide https://github.com/Snatzs/stellaris-mods/blob/master/docs/wiki/effects.md ; Stellaris 4.5.x planet decision example https://stellarisdb.com/decisions/decision-stripmine-planet

## Other tightly scoped unresolved mechanics

- **Combat phase thresholds:** real changes at 70/30% guardian hull may require hook support; prefer native damage/combat triggers and bounded scripted reinforcements. Avoid constant galaxy-wide polling.
- **Species and traits:** organic/Hive/Machine coverage, and compatibility with Vanilla ascension mutual exclusions, require class-specific triggers and real species modification.
- **Research and economy balance:** 42 technologies, 8 building lines, components and megastructures need comparisons to installed 4.5.3 values rather than invented definitive balance claims.
- **Multiplayer:** country-keyed targets and exactly-once flags are designed, but MP/OOS safety is not proved by static review.

## Go/no-go and testing cost

**GO for Package A implementation in one mod.** The known script features make a feasible route plausible, but exact star-only system insertion, safe reservations, GUI-independent slot extensions and planet state semantics are not yet engine-proven. Do not create a prototype/test mod or broad testing matrix now. A very short source inspection at the relevant implementation point is sufficient; any unknown is explicitly flagged rather than hidden. Only test the connected playable Package A when it exists.
