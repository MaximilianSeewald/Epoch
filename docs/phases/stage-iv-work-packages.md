# Stage IV – Work Packages A–D

> **Status:** Planned; no executable Stage-IV code yet. Companion: [full design](stage-iv-ascension.md) and [short engine-feasibility assessment](stage-iv-technical-feasibility.md). Target: Stellaris 4.5.3. **One EPOCH mod, not a separate test mod or submod.** Keep development fast and gameplay-driven. Work on feature branches and review/merge PRs deliberately; do not merge as part of drafting.

## Completion contract across packages

Stage IV begins after private Stage-I/II continuation and global Stage-III victory, 5–10 years later. Each empire has separate progress and the chance to win its personal hard Leviathan; its victory unlocks *research eligibility*, never 36 free technologies. Prior harm may be positively converted at real cost before guardian combat. Four traditions, five perks, 42 technologies, eight building families, seven weapons, six ship components, five traits, one new resource and three megastructures complete the content target. No mandatory separate mod or one-off mass QA per tiny change.

## Package A – Personal Ascension and final guardian

**Goal:** One playable connected six-chapter storyline from invitation to earned personal protocol key.

**Deliverables:** owner-scoped eligibility; staggered post-crisis start; six-section personal situation; two staffed real science-ship investigations; four-stage excavation; costs/options; introduction of six pre-guardian prototype technologies or minimal functional equivalents; paid real healing with a positive terminal feature and alternatives for colonyless/no valid worlds; prototype build; staged lore revelations; one extreme but recoverable planet-free-system Leviathan per eligible empire; genuine native military death proof; final personal key and exactly-once end event; DE/EN and UI.

**Before coding:** fast source-only check for a reachable star-only system + unique owner targets, excavation and ship-death hooks, and planet-state transition patterns. Use existing Stellaris 4.5.3 source; no probe mod or long framework.

**Acceptance:** One coherent manual playthrough reaching the key; no repeated old Stage-III war; real excavation phases and planet feature effects; boss actually fights, can defeat the player, survives a failed attempt, and dies only in combat; private multi-empire state isolated. Targeted regression checks for old Stage I–III, callback safety and save-state idempotency. Any material unresolved engine limitation is recorded, not silently assumed away.

**Non-goals:** full 42-tech tree; all new perks/megastructures; large-scale multiplayer matrix.

## Package B – New technology era

**Goal:** Flesh out 42 coherent regular technologies and their production/combat systems.

**Deliverables:** exact research IDs and non-cyclic dependencies for 14 Physics + 14 Society + 14 Engineering; 6 pre-boss and 36 post-boss eligibility gates; one EPOCH strategic resource, Protocol Cores; 8 building families with 2–3 upgraded levels; 7 new weapons and 6 ship components; AI weights and source-compatible ship/hull availability; clear native tooltips, DE/EN, art paths; balance comparison to high-end vanilla rather than arbitrary empire-wide buffing.

**Acceptance:** Techs appear in the normal research menu and all dependencies are reachable; unlocks actually produce usable buildings/components and native research costs; no free tech bulk grants or invalid resources; focused playtesting of a representative early, middle and ultimate tech subset. Do not demand 42 separate manual microtests.

**Non-goals:** class paths and megastructures (Package C).

## Package C – Ascension specializations and infrastructure

**Goal:** Native 4-tree, 5-perk social ascension content with real lasting transformations.

**Deliverables:** one universal + three class-bound traditions (each adoption + five + finisher); three class-specific perks + two mutually exclusive ultimate philosophies; 5 class-compatible species traits; 3 multistage megastructures; guardian/free philosophy variations and different class implementations; appropriate prerequisite guards; EPOCH Mod UI assets; save compatibility.

**Slot decision before implementation:** vanilla 7 tree slots/8 perks. Examine installed source and determine whether a **single-mod additive approach** can grant usable capacity without overriding Vanilla GUI/defines or other mods. If not, leave slots native and document that players with no free slots still finish narrative/research but cannot add native perks/traditions. No new dependency, second optional mod, silent global UI override or fake perk claims.

**Acceptance:** at least one real organic, Hive and Machine pathway with actual effects, exclusive final perk behavior, no overlap with incompatible vanilla ascension traits; three physical buildable megastructures with real stage effects. Source-checked prereqs and focused integrated test.

## Package D – Integration, balancing and completion

**Goal:** Finish a cohesive final chapter and robust long-term technology era, without reopening already settled Stage III design.

**Deliverables:** complete connection of packages A–C; narrative polish (no foreshadowing in action tooltips), AI progression, single-owner/multi-owner and new/late-save boundaries; complete DE/EN; actual component/building/megacost balancing, difficulty settings and Vanilla behavior; no required Gigastructures. Document any optional future compatibility but do not produce another mod here.

**Acceptance:** full Stage-IV playthrough and focused multi-empire isolation + save/load check; at least one instance per empire class; no unexpected Stage I–III regressions. Multiplayer host/client remains a separate unresolved release-risk until actually tested. Explicitly distinguish static evidence from game evidence.

## Development discipline

- No giant up-front architecture cycle; source-check only the three high-risk interfaces in feasibility notes.
- No independent proof-of-concept or helper mod: implement within the existing EPOCH mod and GitHub repo.
- Make playable features, not pure popup sequences or dummy research rewards.
- One meaningful PR per coherent block/sub-block, not PRs for every text change; user merges after review.
- Preserve source-of-truth docs. Do not mark an unplayed implementation as runtime verified.
- For Codex handoffs: commit, push, give SHA/PR, changed files, short risk list and **single coherent test plan** at the stated milestone.

## Definition of Done

A: a user can earn a personal protocol key through genuine archaeology, healing and combat. B: the 42-tech economy and weapons work in Vanilla menus. C: the four trees/five perks/traits/megastructures behave with valid slot requirements and class restrictions. D: full integrated narrative and tech era run on Stellaris 4.5.3 with clear unresolved test evidence, all without mandatory additional mods.
