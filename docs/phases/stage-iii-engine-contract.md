# Stage III – Engine Validation and Compatibility Contract

**Opening update (2026-11-08):** the subsequent implementation request authorizes the first-offensive slice and static verification before player acceptance. Its [implementation record](stage-iii-opening-implementation.md) supersedes the earlier documentation-only boundary and pre-content runtime sequencing for that slice. All runtime proof requirements below remain unfulfilled release/acceptance gates; they are not waived or reported passed.

**Status: mandatory future proof gates; no Stage-III runtime run or executable probe exists.** Target: installed Stellaris 4.5.3 (4e91), build 26325427. [Engine evidence](stage-iii-engine-evidence.md) contains source observations and absent test outputs. [ADR-002](../architecture/adr-002-stage-iii-integration.md) defines integration policies; [AP0–AP11](stage-iii-implementation-plan.md) defines sequencing. Source observations and static passes never grant implementation authorization.

## 1. Configured clock and hooks — AP1, blocking

Desired semantic: P = configured M minus 20 years; public outbreak around M independently of any personal campaign. Installed `marauder.151` and `syndaw.400` use `mid_game_years_passed >= -10`; generated docs expose `get_galaxy_setup_value`/`check_galaxy_setup_value` for `mid_game_year`, with native arithmetic examples. Negative comparisons are **source-supported**, while -20/0 boundaries and delivery behavior are **runtime unverified**.

Candidate window: `>= -20` and `< 0`; outbreak `>= 0`. Verify independent galaxies with M=2250/2300, just before/at/after P and M, late completion, SP/MP save/reload and zero Stage-II participants. Log setting values/units before alternate arithmetic; do not assume an absolute date or a universal 2200 start. Prove global monthly/midgame dispatch and additive registration without overriding Vanilla hooks. A cheap global monthly guard may repair missed dispatch; no daily whole-galaxy scans or fixed 2280/2300 fallback.

ADR-002 I03/I04 distinguish supported first initialization before M, supported initialized saves after M, and safe placement from an unconditional M..M+1 deadline. Test those policies rather than substituting a late-game ambush or unsafe spawn.

## 2. Single lifecycle, persistence and synchronized state — AP2, blocking

Prove one instance across 0/1/5 eligible countries, concurrent same-day dispatch, country creation/type change, original participant elimination, SP and host/client MP. Global flags/targets exist; actual storage of numeric phases, budgets and durable identities requires a proven carrier/context. Do not invent `is_host`, `set_global_variable` or transactional events.

Reservation precedes creation; idempotent substeps resume partial activation. A terminal tombstone survives cleanup/carrier retirement. Distinguish live canonical objects, stale references and missing objects; reference loss is never victory or reason to spawn another whole crisis. Test unexpected carrier death, partial initialization and surviving fronts after command loss. Insufficient evidence means diagnostic recovery, not duplication.

The SP-only load hook is explicitly excluded from MP saves because of OOS concerns. Regular synchronized simulation must support recovery and enrollment. Test duplicate callbacks, delayed events spanning load, client rejoin, player-to-AI handover and post-resolution reload. Source flags do not prove atomicity, order or MP safety.

## 3. Mobile threat and operational model — AP3, blocking

Compare a custom crisis type using Vanilla Berserk military AI with bounded scripted strategy/native orders. Inspect Khan/Tempest modules, Marauder `auto_move_to_planet`, drone `queue_actions`/`move_to`, Faction Hostility and access predicates. A new type must demonstrate multiple-hyperlane travel, real starbase/installation attack, target loss/reselection, combat, retreat, recovery and AI opposition. Stage-II guardian aggro is not strategic proof; its type stays unchanged.

Validate diplomacy/hostility with relevant countries and closed borders; valid commands are not a legal interaction model. Do not run competing native/custom strategic controllers on one fleet. Check native construction/spawns cannot bypass source cooldown, live-fleet cap or lifetime allowance. Include MIA, split/merge and delayed events. Bound path checks because `can_access_system` is documented expensive.

Version 1 promises real fleet/installation warfare and hazards, not ground occupation. Native Prethoryn transport creation is source evidence only. Ground-invasion extension needs a separate gate: escort, landing, ground battle, actual ownership/control, reconquest and save/MP. Direct ownership effects cannot masquerade as a combat conquest.

## 4. Physical anchors, finite objectives and credit — AP3/AP7/AP8

Preferred research object: immobile armed ship in a separate fleet, analogous to the Gray Tempest factory. Verify visibility, immobility, owner, death and scientific interaction. A star flag/ambient object is not a destroyable station. A starbase alternative needs ownership, capture/replacement and cleanup proof; never overwrite foreign bases.

Persist object identity/generation separately from the three functional roles. Two anchors may carry three roles, but science still needs at least two valid physical research sites. Disable/destroy must stop or reduce linked reinforcements. Queued spawns revalidate source and phase at execution. Replacement is bounded, cannot reset budgets and cannot duplicate a living canonical object. Budget exhaustion must leave an obtainable physical endgame, not nonexistent required kills or timed victory.

Ship/fleet/starbase destruction hooks differ in scope. `on_space_battle_won` is not destruction proof. Test destroyed-object lifetime and join/exit/death ordering with direct/allied/foreign final blows, retreat, commandant death with surviving escort and cleanup removal. Do not presume a battle ID or damage attribution. Conservative national credit is acceptable; fictional participation is not. Simultaneous research callbacks resolve a function once and guard real national rewards separately.

One validator serves military destruction and scientific shutdown; joint containment adds proven multi-empire contributions. Scientific shutdown disables all remaining functions and actually deactivates/withdraws the command network. Missing targets trigger recovery, never credit. Cleanup stops spawns first and excludes its own deaths from success.

## 5. Shared features and active old campaigns — AP4, blocking

Inspect existing setters, cleanup/migration, decision guards, Planet/Colony promotion and owner scopes. Old helpers clear shared state and may reference personal targets or dispatch rewards; they are not a global exposure API. New III operations never write old story progression, opt-out or ready flags. Reuse existing deposit definitions only with proven minimal carrier state and no old recovery interference. No changes to Stage-I/II mechanics or definitions are authorized.

Test matched Bio/Hive/Machine economies, one colony, zero production of a penalized resource, active Stage-I/II targets, contained/controlled/studied/healed worlds, conquest, new colony and new country. Use I01's supplementary modifier where no conflict-free family transition exists. Never force E03 by overwriting protection or adding a second state in a family. Observe subsequent old callbacks: their original result and III's separate genuine pressure must stay correct without modifying old code. Otherwise stop at the scope gate.

Measure actual resource/research/stability deltas against snapshots; Prepared is nonzero and comparable Uninitiated strictly worse. Existing penalties do not count as new damage. Validate economy/features/tooltips after load and owner transfer, private reward isolation and no repeated initial strike solely on transferred worlds. Check initialization depth; the current baseline depth 3 does not certify new chains.

## 6. Optional systems, country coverage and performance

Core must not require Community, federation, a specific origin, optional DLC assets or Gigas. Cooperation can use actual fleets/projects without resolutions. Any later Community measure requires verified API/triggers and a functional no-Community path; do not override Vanilla definitions.

Test normal subjects, playable colonyless/mobile empires, observers and ADR-002's special-country matrix. Fallen/Awakened, marauder, enclave, guardian, pre-FTL and other-crisis entities are not normal colonized countries by assumption. No blanket new combat immunity; document native restrictions and alternatives. Voidworm explicitly neutralizes enclaves, so copying that behavior does not prove the desired EPOCH matrix. Test Khan/Tempest/Voidworm overlap without changing their state.

Profile scan/path counts, registry size, replans/spawns and simulation time on small/large galaxies at rest and maximal load. AP9 establishes measured thresholds against a matching baseline; no unmeasured performance guarantee. Exact Gigas version, metadata, load order and combined balance are separate AP11 targets.

## 7. Evidence deliverable and G1

After separate authorization, each result records **assertion → exact source/build → fixture/commands → actual output/log/save/settings → remaining uncertainty** in the [register](stage-iii-engine-evidence.md). Preserve failures. Console-completed objectives do not count as earned production success. Static output stays S, never runtime-pass.

G1 requires actual relative timing/additive hooks, singleton persistence including MP, native mobile hostility, physical anchor/source shutdown and safe planetary integration from AP1–AP4. An absent/failed critical proof blocks substantial production content. Present evidence and a reviewed alternative; never quietly patch old stages, hardcode dates, declare MP safe or substitute counters for physical objectives. Full connected acceptance remains required after G1.
