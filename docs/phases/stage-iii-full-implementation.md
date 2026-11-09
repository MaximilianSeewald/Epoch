# Stage III – connected campaign after the first playtest

Date: 2026-11-09. Tested opening baseline: `b4214087380d5548e7472e4ec197bb21b49b2144`. Branch: `feature/stage-iii-convergence`; existing PR #15 remains open and unmerged. Target: installed Cygnus 4.5.3 (4e91).

The user confirmed the previous opening in-game, including real attacks and anchor-linked reinforcement stopping. They rejected its gameplay: a single weak offensive ended too quickly and its location was unclear. This expansion is implemented and statically checked. No new engine, balance, save/load or MP pass is claimed.

## Connected gameplay

1. **The Answering Signal:** the existing consent-gated private warning and paid research remain available only from configured M−20 to M. At M one shared country starts regardless of personal history. A native diplomatic transmission shows a base-game robot portrait. Recording it grants five years of +10% research speed; mobilizing grants five years of +20% shipyard build speed. Neither answer changes hostility.
2. **The Silent Borders:** two mandatory safely selected systems, a third on medium or larger maps and a fourth on large/huge maps where safe candidates exist. No country assets are replaced. Each system has a native large AI station plus two immobile small stations in a defended node fleet, a fourteen-Enforcer garrison, and two outgoing Hunter/Enforcer fleets immediately. One node loss cannot stop other sources.
3. **The Three Foci:** the first native formation loss exposes the three functions. Interdiction is the first fortified node. The second node causes additional planetary strikes against adjacent ordinary empires. The third node coordinates logistics; with only two sites this function is combined with the scar node. A fourth node is a reserve source. Every registered node remains a physical military objective. Destroyed nodes offer actual 180-day scientist-led science-ship projects at their stars. Failed or canceled projects become available again while the crisis is active. Global study flags suppress duplicate completion and abort obsolete copies.
4. **Convergence:** the first node destroyed in battle triggers one unique native large AI command ship with twenty-four Enforcers. It uses the same bounded movement controller as attackers, with a separate ship-death hook for the actual commandant. One secured-site study limits each remaining source to four lifetime sorties; two studies reduce all surviving Nullwarden weapon damage and shields by 20%, including future formations. Study also unlocks the existing counterharmonics/planetary buffering response.
5. **The Last Order:** every registered fortified node must be destroyed. The command ship, all surviving attackers and all garrisons require genuine combat defeat. No project, payment, elapsed time, situation progress, missing reference or scripted removal can end the crisis. Fleet and ship victim hooks require a foreign perpetrator plus an actual perpetrator fleet/ship. Surviving escorts remain obligations after command-ship death. The final report reflects military, science-supported or joint success. Native final-blow contributors receive a once-only ten-year +5% fire-rate modifier. Old scars and prior story choices survive.

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

Preparation and offensive situation type/monthly-change keys exist in EN/DE. Passive approaches now have real on-select tooltips. Station fleets receive no unsupported fleet-stance command; only native mobile formations receive aggressive stance.

## Persistence and conservative recovery

Reservation precedes formation creation. Country, front, source-spent, native-death and terminal facts persist independently of any participant's campaign. Monthly simulation rediscovers lost live node references by identity on the canonical country; absent objects without battle proof stop the relevant source and log a diagnostic, never create a replacement or victory. Lifetime budgets never regenerate after retreat or loss. Missing guards/raids cannot bypass their native-death accounting.

An active opening save can adopt its existing primary anchor and preserve spent/death records; that old source receives no fresh allowance. Additional fronts are initialized once. A previously resolved opening remains terminal and is not silently restarted. New games and compatible saves initialized before M are the acceptance fixtures. First installation after M remains unsupported and fails closed, as documented previously. Opening-save upgrade, save/load and MP are implemented conservatively but still require runtime validation.

## First-run log investigation

Named attachment files `error(8).log` / `game(8).log` were not found in the checked attachment/project/game-log trees. The current local `error.log` contains the exact reported opening diagnostics: missing situation keys and approach effects at lines 8–13, and the unsupported anchor stance at line 599. These are pre-change evidence, not a fresh run of this implementation.

The Silent Structure diagnostics at lines 363/431/499 originate in installed Vanilla `events/ancient_relics_site_spawn_event.txt`, `ancrel.15050`, lines 91/113/131. The global `on_arch_site_finished` hook invokes this event with a fleet ROOT and archaeological-site FROM. It unconditionally attempts FROM.planet, including its final fallback. The log proves this promotion fails for the existing EPOCH site. The EPOCH site is created on its saved physical world; generated scope documentation says the promotion is supported, but the runtime contradicts it for this host. This is an EPOCH-associated Vanilla integration defect, not a proven error in a Stage-III callback. No Vanilla event override or speculative rewrite of old excavation/rewards is introduced. It remains an explicit runtime limitation requiring a narrow engine-compatible fix once the host-link behavior is established. It is not marked fixed or hidden among unrelated errors.

Other logs include Workshop portrait/flag assets and native caravan/subject diagnostics. They are outside this change. The classifier keeps the EPOCH-associated archaeological failure visible separately. Old gameplay files remain byte-equivalent after CRLF normalization to PR #14; this expansion does not claim to repair the Vanilla archaeological completion path.

## Static evidence and remaining validation

Run `powershell -ExecutionPolicy Bypass -File scripts/test_epoch_regressions.ps1`, including the full Clausewitz parser, unchanged old-stage flow/economy/narrative regressions, native component checks and expanded source-guard assertions. The dated static-output artifact records actual results. Source observations never certify native travel, UI, AI balance, research delivery, loss hooks, SP saves or host/client synchronization.

One connected player acceptance session should start from a pre-M save with a qualified prepared empire and an uninitiated neighbor. Let the outbreak occur naturally, inspect the transmission/front markers, fight and lose an initial battle, rebuild, then destroy different nodes and inspect changes to propagation and reinforcement. Keep one checkpoint before the first node falls and branch it into direct military, two-site science-supported and two-empire combat finishes. In each branch verify the command vessel dies in actual combat, surviving escorts still block completion, no more reinforcements arrive from destroyed nodes, old world states survive, and reload before/after completion gives no repeat reward. Collect fresh error/game logs with the tested SHA. Separate targeted M/gestalt/MP fixtures remain part of the acceptance matrix, not implied by this one session.
