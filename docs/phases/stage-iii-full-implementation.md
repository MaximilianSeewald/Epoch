# Stage III – connected campaign after the first playtest

Date: 2026-11-09. Tested opening baseline: `b4214087380d5548e7472e4ec197bb21b49b2144`. Branch: `feature/stage-iii-convergence`; existing PR #15 remains open and unmerged. Target: installed Cygnus 4.5.3 (4e91).

The user confirmed the previous opening in-game, including real attacks and anchor-linked reinforcement stopping. They rejected its gameplay: a single weak offensive ended too quickly and its location was unclear. This expansion is implemented and statically checked. No new engine, balance, save/load or MP pass is claimed.

## Shared galactic chapters (gameplay review, 2026-11-09)

The canonical saved hostile country owns one authoritative variable, `epoch_iii_chapter`. Global chapter flags are compatibility/history facts; local display flags are no longer read or incremented. The existing no-scope coordinator dispatches this country regardless of Stage-I/II participation. Research callbacks and local approaches cannot write or dispatch chapter progression.

| Chapter | Required global physical evidence | Identical displayed progress |
|---|---|---|
| I — The Answering Signal | Registered physical fronts and outbreak; native diplomatic transmission per empire | 0 |
| II — The Silent Borders | A real raid crosses into an ordinary empire's system, or a verified hostile formation dies in combat | 21 |
| III — The Three Foci | First verified native formation loss; reports expose the separate front functions | 41 |
| IV — Convergence | A fortified node has genuinely fallen in combat; create the unique command formation exactly once | 61 |
| V — The Last Order | Every registered fortified node has genuinely fallen | 81 |

Every transition also requires expiration of a saved 90-day dwell guard on the canonical country. The reverse-ordered exclusive branches allow only one transition per dispatch. Earlier genuine evidence is retained, but cannot cascade several chapters in one battle tick. Time alone satisfies no military milestone. A final 90-day minimum display interval also precedes resolution; the unmodified combat obligations remain mandatory. This pacing is a tuning choice requiring acceptance, not measured balance.

Each empire's native situation is an absolute projection using the documented `set_situation_progress` effect, never a local increment or local completion reward. A transition publishes to all enrolled empires in that same coordinator execution. Creation/type-change hooks enroll newly eligible empires and project the current saved chapter immediately; the monthly pass repairs missed enrollment or missing/stale main situations. No personal project or display stage entry grants military credit or rewards. Private M−20 preparation is still a separate situation.

Active older saves adopt their highest existing global chapter/command fact once. The migration does not reset destruction proofs, spent reinforcement budgets or command creation. Old local display flags are ignored. A missing canonical reference still fails closed using existing identity recovery; it cannot create another crisis or infer victory. Engine serialization, event ordering and host/client UI refresh remain unverified.

## Local responses and military choices

Four native mutually exclusive approaches have continuous, automatically scoped modifiers and upkeep. They affect only their owner's response, including ordinary ships/research/economy, and disappear when the situation closes:

| Response | Benefit | Cost / tradeoff |
|---|---|---|
| Mobilization (default) | +20% shipyard build speed | 10 energy + 3 alloys/month; +5% ship upkeep |
| Analysis | +10% research speed; reopens paid personal counterharmonics proposal | 15 energy/month; −10% shipyard build speed |
| Planetary shielding | +5 stability, +5% job output across owned worlds | 20 energy + 5 minerals/month; +10% ship upkeep |
| Counteroffensive (from III) | +10% fire rate and ship speed | 15 energy + 5 alloys/month; +15% ship upkeep |

Shielding supports world economies but does not clear old planetary features or permanently buffer worlds. The existing paid 90-day planetary buffering decision remains available. Counterharmonics, scientist-led secured-site studies, source budgets and the three military victory variants retain their existing requirements. Organic veterans refer only to their own saved network experience; Hive and Machine operational briefings use distinct perspectives. The first diplomatic transmission and Stage-IV information boundary remain intact. EN/DE keys cover all additions.

The first interdiction node now supports **+20% shields throughout the hostile network** until destroyed. The scar node continues periodic planetary pressure; destroying it stops new strikes without healing old damage. The signal relay restricts other sources to three lifetime sorties, and the optional reserve remains an independent source. Thus attacking shields, planetary pressure or logistics first leaves the other functions dangerous. One secured-site study limits remaining sources to four sorties; two weaken hostile weapons/shields by 20%. These studies assist combat without changing any chapter.

The command vessel gives existing and future raids +15% fire rate and speed, cancels old offensive replanning cooldowns, and makes nearby inhabited systems preferred targets. Its own formation receives the same pressure bonus. Surviving formations retain that last order after its destruction. In chapter V all mobile attackers, the command formation and surviving garrisons receive native movement orders toward the **first marked front**, which remains the main situation's map target. Ordinary roaming is bypassed. Out-of-combat, enabled fleets replan at most every 180 days; no teleport, scripted death, reference-loss credit or reinforcement-budget refund occurs. Native path failures, aggro interruptions and disconnected topology can still delay arrival and require runtime inspection; inaccessible fleets remain real military obligations.

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
| First distinct wreck study | other sources limited to 4 lifetime sorties each |
| Second distinct wreck study | −20% Nullwarden damage/shields; no military objective removed |
| Ordinary sortie | 16 Hunters + 12 Enforcers; +8 Enforcers if at least 100 years have elapsed from configured game start; +6 if chosen crisis strength is at least 2 |
| Planetary propagation | living scar source, 720-day cooldown, adjacent empires only, at most 3 additional struck worlds per empire, once per physical world |

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

The review regression run is recorded in [synchronization static output](../research/stage-iii-synchronization-static-checks-2026-11-09.txt). It includes interpreted coordinator transitions for two empires, personal research isolation, repeated dispatch, stale display repair, late chapter-IV enrollment, physical final gates and unchanged old-stage files. These are explicit static models, not actual saves or multiplayer sessions.

Runtime acceptance must additionally check two human empires displaying the same chapter throughout; one personal research completion; an AI anchor kill with a single publication; a newly created chapter-IV empire; save/load during chapter III without report/reward duplication; outbreak without Stage-I/II participants; and a final combat finish in each of the three variants. Also inspect five-stage boundaries, approach upkeep/removal, new global shield support, command target pressure and reachable final rally orders. No new ingame run has been performed.

One connected player acceptance session should start from a pre-M save with a qualified prepared empire and an uninitiated neighbor. Let the outbreak occur naturally, inspect the transmission/front markers, fight and lose an initial battle, rebuild, then destroy different nodes and inspect changes to propagation and reinforcement. Keep one checkpoint before the first node falls and branch it into direct military, two-site science-supported and two-empire combat finishes. In each branch verify the command vessel dies in actual combat, surviving escorts still block completion, no more reinforcements arrive from destroyed nodes, old world states survive, and reload before/after completion gives no repeat reward. Collect fresh error/game logs with the tested SHA. Separate targeted M/gestalt/MP fixtures remain part of the acceptance matrix, not implied by this one session.
