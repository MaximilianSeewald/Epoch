# Stage III – connected campaign after the first playtest

Date: 2026-11-09. Tested opening baseline: `b4214087380d5548e7472e4ec197bb21b49b2144`. Branch: `feature/stage-iii-convergence`; existing PR #15 remains open and unmerged. Target: installed Cygnus 4.5.3 (4e91).

The user confirmed the previous opening in-game, including real attacks and anchor-linked reinforcement stopping. They rejected its gameplay: a single weak offensive ended too quickly and its location was unclear. This expansion is implemented and statically checked. No new engine, balance, save/load or MP pass is claimed.

## Shared galactic chapters (final gameplay review, 2026-11-09)

The canonical saved hostile country still owns the authoritative `epoch_iii_chapter` variable. All main situations receive the same absolute projection; private M−20 preparation and personal research remain separate. No new architecture or Vanilla overrides are introduced.

| Chapter | Required global evidence | Displayed progress |
|---|---|---|
| I — The Answering Signal | Registered physical fronts and outbreak; native diplomatic transmission | 0 |
| II — The Silent Borders | A raid crosses an ordinary empire's border, or a verified formation dies in combat | 21 |
| III — The Three Foci | A formation's verified native combat destruction exposes the front functions | 41 |
| IV — Convergence | A fortified node has genuinely fallen; create the unique command formation once | 61 |
| V — The Last Order | Every registered node has fallen, and the command formation has entered actual combat or been destroyed | 81 |

The former 90-day chapter and victory locks are removed, including stale saved lock flags. Earned milestones are consumed in ascending story order in one coordinator execution, so a rapid first anchor kill can immediately publish discovery and create the commandant. Each chapter's equality guard prevents repeated reports. If every anchor falls quickly, chapter IV lasts until the commandant actually joins combat; it does not disappear before the reserved formation can act. Both orientations of the native battle-entry hook are handled. Battle entry only permits the final chapter, never supplies ship/fleet destruction credit. Final victory has no additional timer and still uses the shared native-combat validator.

Creation/type-change enrollment immediately projects the current chapter. Monthly dispatch repairs missed enrollment or missing/stale main displays. Older active saves retain destruction proofs, spent budgets and command creation. No project, approach, display stage or marker cleanup can grant military credit. Save serialization, event ordering and simultaneous host/client UI refresh remain runtime checks.

## Local responses and military choices

The four mutually exclusive native approaches now use the installed country-type damage modifier for crisis-specific targeting. General research/output subsidies are removed. All base upkeep doubles at **8 colonies**, quadruples at **20**, and reaches eight times base at **40**; percentage construction/maintenance costs additionally scale with actual military spending. Native modifier/resource tables show the costs and disadvantages; descriptions explain the thresholds. AI avoids optional energy-deficit approaches and prioritizes shielding when worlds actually suffer severe disruption.

| Response | Benefit | Cost / tradeoff, before colony multiplier |
|---|---|---|
| Mobilization (default) | +10% shipyard build speed | +10% shipyard ship cost, +5% ship upkeep; 4 energy + 1 alloy/month |
| Analysis | +10% damage **against Nullwardens only**; reopens paid counterharmonics briefing | −5% technology research speed, −10% shipyard speed; 6 energy/month |
| Planetary shielding | Local relief of 2/3/5% job output and 1/2/3 stability according to existing disruption severity | −2% job output empire-wide; 5 energy + 2 minerals/month |
| Counteroffensive (from III) | +20% damage **against Nullwardens only** | +15% ship upkeep, −10% technology research speed; 5 energy + 2 alloys/month |

Shielding relief applies only to unbuffered crisis-damaged worlds; intact and permanently buffered worlds receive nothing. The relief never exceeds the original disruption. Switching approaches, permanent buffering and crisis resolution remove temporary relief while preserving all base damage and old features. Monthly reconciliation also adopts the selected shielding approach in older saves. The separate paid planetary buffering decision remains unchanged. Personal counterharmonics now grants its ten-year +10% damage only against Nullwardens.

New safe front selection prefers a primary separation of at least **four hyperlane jumps** and at least **three** between secondary fronts, within an 80-jump connected region. The mandatory second front may relax to one jump if no spaced safe candidate exists; optional fronts are omitted if spacing/safety cannot be met. No existing assets are seized. Already registered save-game fronts are never relocated.

Front order remains consequential: the interdiction node sustains +20% hostile shields; the scar node strikes adjacent empires; the signal relay limits each other source to three lifetime sorties; the reserve is independent. Initial exposure now affects one distinct world, then one more at 12, 24 and 40 colonies (maximum four). Scar pressure excludes initial exposure and buffered worlds, with additional-world caps of 1/2/3/5/10 at below 8 / 8 / 12 / 20 / 40 colonies. Each 720-day source pulse strikes one world per adjacent empire, plus one at 12 and 24 colonies. A short owner guard prevents multiple adjacent systems multiplying one pulse. Thus one-world empires never receive stacked initial/scar strikes, while large empires face several distinct affected worlds. Previous worlds, features and investigations remain protected.

Wreck-site studies retain their native scientist/science-ship requirements but take **90 days**, down from 180. The first distinct study immediately reduces all hostile weapon damage by **10%** and limits remaining source budgets to four lifetime sorties. A second replaces this penalty with **−20% weapons and shields**, without stacking the first penalty. Future formations inherit the earned result. Science never advances chapters or removes military obligations.

The command fleet now makes a distinct strategic move: reinforce a reachable surviving node currently threatened by an ordinary empire's fleet; otherwise cover a reachable living node. After every node falls it seeks a nearby accessible opposing fleet or inhabited system. Raids retain their offensive behavior. Command support grants +15% hostile fire rate/speed while the unique command ship survives; its genuine destruction removes that support, including when adopting an old save where the ship already died.

## Reachable military finale

Surviving mobile formations and garrisons prefer the first old front they can actually reach (primary, then secondary/reserve alternatives). If no registered front is accessible, they seek a nearby accessible opposing military fleet; otherwise they hold locally. Every surviving group's current system is published through the existing map-marker situation to all enrolled empires, including disabled/in-combat groups and the commandant during chapter IV. Empty locations lose their marker; this never supplies death credit.

Navigation retries use 45-day guards. Active move orders are preserved, so periodic checks cannot continually cancel native travel/FTL charging. A blocked route can trigger a new route selection; stopped formations replan after battles or recovery. No teleport, disband, scripted death, budget refund or automatic victory occurs. A defeated player can rebuild and return to marked military targets. Truly inaccessible geography still requires native travel capabilities: the scripts expose the group instead of pretending it was defeated. Engine pathfinding, bypass travel, aggro, marker refresh and balance require runtime acceptance.

## Installed Vanilla comparison

Targeted comparison uses the actual installed 4.5.3 source, with no Vanilla overrides: `events/marauder_events.txt` (`marauder.505`, `marauder.523`) ties the Khan's military turning points and renewed offensive to a canonical faction and verified losses; EPOCH similarly makes a unique command appearance change the offensive, without copying resurrection or submission. `events/gray_goo_events.txt` (`graygoo.3`) gates reinforcement on the live factory: EPOCH retains physical, independently destructible finite sources and adds a shield-support function. `common/situations/11_grand_archive_situations.txt` separates the Voidworm coordinator from local plague approaches: EPOCH adopts costed local responses while deliberately keeping all five military chapters globally synchronized. The Vanilla vaccine-driven individual progression is not copied.

## Parameters and dependencies

| Setting | Implemented bound |
|---|---|
| Physical fronts | 2 mandatory; up to 3 on medium and up to 4 on large/huge, subject to safe sites |
| Mobile start | 2 per source, 4–8 simultaneous attackers, plus 2–4 separate garrisons |
| Reinforcements | 6 lifetime sorties per source INCLUDING its two opening sorties, 540-day per-source cooldown |
| Shared cap | 12 ordinary attack formations; one separately reserved command formation |
| Total ordinary sorties | at most 24; destroying a source stops it permanently |
| Signal relay destroyed | other sources limited to 3 lifetime sorties each; already spent budget is never refunded |
| First distinct wreck study | other sources limited to 4 lifetime sorties each; −10% hostile weapon damage |
| Second distinct wreck study | −20% Nullwarden damage/shields; no military objective removed |
| Ordinary sortie | 16 Hunters + 12 Enforcers; +8 Enforcers if at least 100 years have elapsed from configured game start; +6 if chosen crisis strength is at least 2 |
| Planetary propagation | living scar source, 720-day cooldown, adjacent empires only; size-scaled cap of 1–10 distinct additional worlds; no initial/buffered-world stacking |

These are source-checked tuning values, not measured balance results. Later configured M naturally allows more elapsed years and a larger reinforcement composition. High crisis-strength scaling is deliberately capped rather than multiplied without bound. Safe placement can remain pending if fewer than two valid frontier systems exist; no single-front or capital-ambush fallback is used.

Planetary exposure freezes the existing prepared/experienced/uninitiated cohorts. Broad output/stability overlays affect organics, Hives and Machines. Already buffered worlds resist subsequent scar strikes. Existing contamination/scar definitions are reused only on conflict-free carriers; active personal objectives and existing feature-family states receive supplementary crisis pressure instead. There is no new Silent Structure excavation site because no new physical archaeological structure is introduced. Colonyless countries retain real ship-upkeep disruption until counterharmonics. Conquest does not reapply an already marked strike. No old progression setter or flag is written.

## Visibility and native interfaces

Previously enrollment only surveyed the primary system. Survey knowledge does not provide live fleet intelligence, and one situation offered no navigation to other fronts. Enrollment now establishes communications, visits/surveys only registered front systems, grants the native military-intel tier containing fleet positions/orders for the hostile country, and gives every live front its own Situation Log target. Unrelated systems are not globally surveyed. See the source manifest for Tempest/Khan diplomatic precedents, native intel tiers, AI station layouts, documented scopes and destruction-hook contracts.

The diplomatic transmission is once per enrolled country. The hostile country appears in contacts; bespoke repeat conversations through its contact screen are not implemented. The Situation briefing remains available for operational research. A larger custom diplomatic interface is unnecessary.

Preparation and offensive situation type/monthly-change keys exist in EN/DE. The offensive now has four costed local responses; only preparation and map markers retain passive approaches. Station fleets receive no unsupported fleet-stance command; only native mobile formations receive aggressive stance.

## Persistence and conservative recovery

Reservation precedes formation creation. Country, front, source-spent, native-death and terminal facts persist independently of any participant's campaign. Monthly simulation rediscovers lost live node references by identity on the canonical country; absent objects without battle proof stop the relevant source and log a diagnostic, never create a replacement or victory. Lifetime budgets never regenerate after retreat or loss. Missing guards/raids cannot bypass their native-death accounting.

An active opening save can adopt its existing primary anchor and preserve spent/death records; that old source receives no fresh allowance. Additional fronts are initialized once. A previously resolved opening remains terminal and is not silently restarted. New games and compatible saves initialized before M are the acceptance fixtures. First installation after M remains unsupported and fails closed, as documented previously. Opening-save upgrade, save/load and MP are implemented conservatively but still require runtime validation.

## First-run log investigation

Named attachment files `error(8).log` / `game(8).log` were not found in the checked attachment/project/game-log trees. The current local `error.log` contains the exact reported opening diagnostics: missing situation keys and approach effects at lines 8–13, and the unsupported anchor stance at line 599. These are pre-change evidence, not a fresh run of this implementation.

The Silent Structure diagnostics at lines 363/431/499 originate in installed Vanilla `events/ancient_relics_site_spawn_event.txt`, `ancrel.15050`, lines 91/113/131. The global `on_arch_site_finished` hook invokes this event with a fleet ROOT and archaeological-site FROM. It unconditionally attempts FROM.planet, including its final fallback. The log proves this promotion fails for the existing EPOCH site. The EPOCH site is created on its saved physical world; generated scope documentation says the promotion is supported, but the runtime contradicts it for this host. This is an EPOCH-associated Vanilla integration defect, not a proven error in a Stage-III callback. No Vanilla event override or speculative rewrite of old excavation/rewards is introduced. It remains an explicit runtime limitation requiring a narrow engine-compatible fix once the host-link behavior is established. It is not marked fixed or hidden among unrelated errors.

Other logs include Workshop portrait/flag assets and native caravan/subject diagnostics. They are outside this change. The classifier keeps the EPOCH-associated archaeological failure visible separately. Old gameplay files remain byte-equivalent after CRLF normalization to PR #14; this expansion does not claim to repair the Vanilla archaeological completion path.

## Static evidence and remaining validation

Run `powershell -ExecutionPolicy Bypass -File scripts/test_epoch_regressions.ps1`, including the full Clausewitz parser, unchanged old-stage flow/economy/narrative regressions, native component checks and expanded source-guard assertions. The dated static-output artifact records actual results. Source observations never certify native travel, UI, AI balance, research delivery, loss hooks, SP saves or host/client synchronization.

The earlier synchronization regression run is recorded in [synchronization static output](../research/stage-iii-synchronization-static-checks-2026-11-09.txt). The final gameplay pass is recorded in [final gameplay static output](../research/stage-iii-final-gameplay-static-checks-2026-11-09.txt). It includes interpreted coordinator transitions for two empires, personal research isolation, repeated dispatch, stale display repair, late chapter-IV enrollment, physical final gates and unchanged old-stage files. These are explicit static models, not actual saves or multiplayer sessions.

Runtime acceptance must additionally check two human empires displaying the same chapter throughout; one personal research completion; an AI anchor kill with a single publication; a newly created chapter-IV empire; save/load during chapter III without report/reward duplication; outbreak without Stage-I/II participants; and a final combat finish in each of the three variants. Also inspect fast milestone consumption, both battle-hook orientations, size-scaled native approach upkeep, temporary shielding removal, separated front placement, first-study combat effects, command rescue orders and alternate final rally paths. No new ingame run has been performed.

One connected player acceptance session should start from a pre-M save with a qualified prepared empire and an uninitiated neighbor. Let the outbreak occur naturally, inspect the transmission/front markers, fight and lose an initial battle, rebuild, then destroy different nodes and inspect changes to propagation and reinforcement. Keep one checkpoint before the first node falls and branch it into direct military, two-site science-supported and two-empire combat finishes. In each branch verify the command vessel dies in actual combat, surviving escorts still block completion, no more reinforcements arrive from destroyed nodes, old world states survive, and reload before/after completion gives no repeat reward. Collect fresh error/game logs with the tested SHA. Separate targeted M/gestalt/MP fixtures remain part of the acceptance matrix, not implied by this one session.

## Compact connected ingame acceptance plan for this revision

Use one pre-M multiplayer fixture with a small unprepared empire and a larger experienced empire. Let the outbreak happen naturally, inspect safe/spaced fronts and identical chapters, then switch all four responses and check native costs, colony thresholds, fleet/build costs and affected-world-only relief. Let the scar source survive one pulse and verify distinct bounded exposure without stacking the initially struck world.

Save before the first anchor kill. Destroy nodes quickly, including an AI final blow, and verify discovery/command appearance immediately and exactly once in both empires. Study one secured site for 90 days while other fronts remain alive, then a second: inspect −10% damage first, replacement by −20% damage/shields second, and unchanged chapters. Bring a fleet to another living node and observe the commandant reinforce it. Save/reload here; add a new chapter-IV empire and inspect equal progress.

Destroy the remaining nodes and engage the commandant. Verify immediate shared chapter V, marked remaining groups, alternate reachable rally routes and uninterrupted native travel. Deliberately lose a player engagement, rebuild and intercept the marked targets. A surviving escort must still block victory after command-ship death; command support must disappear. Finish every registered formation in real combat and verify immediate resolution, single rewards, removal of temporary approach relief and preservation of old planetary features. Revisit the checkpoint only to cover solo direct, two-study and joint military finishes; no separate general optimization pass is planned. Collect fresh logs and tested SHA. This plan is pending execution, not a claimed runtime result.
