# Stage III: first-offensive implementation and player acceptance

> **Current contract, 2026-11-09:** The post-playtest implementation request supersedes the opening-only scope and earlier pre-implementation approval gates. The connected five-chapter campaign is implemented for static review; new gameplay has **not** been run in Stellaris. The user's first test confirms only the previous opening at `b421408`. All resolution variants now require destruction of every registered fortified node, the unique command ship in actual combat, and surviving hostile formations. Science weakens logistics and combat; it never withdraws, deletes or automatically defeats the command formation. Cooperation uses this same military validator. See [current implementation](stage-iii-full-implementation.md).


Date: 2026-11-08. Base: PR #14, `f3e985615b9ca137b2d99727f76633e21e3066ef`.
Target inspected locally: Stellaris Cygnus 4.5.3 (4e91), Steam build 26325427.

**Historical opening record.** The user subsequently ran this opening in Stellaris and confirmed outbreak, situation, planetary exposure, mobile combat and anchor-linked reinforcements. Gameplay acceptance failed due to visibility, insufficient defenses and premature termination. The new implementation supersedes the numerical/terminal rules below.
The implementation request authorizes this connected opening through the defeat
of the first offensive, followed by static verification and a PR. It supersedes
the documentation-only authorization boundary and the AP1–AP4/G1 requirement to
complete runtime probes *before writing this slice*. It does not certify those
probes: timing, native travel/combat, saves, AI and MP remain release gates. The
full five chapters, multiple functional fronts, commandant, scientific network
shutdown and final galactic victory remain future work under the original plan.

## Playable sequence

1. In the relative interval M−20 through before M, a supported, completed Stage-II
   country with a recorded explicit Continue receives a private warning and a
   preparation situation. The proposal costs 500 Energy + 300 Alloys and opens
   an actual 900-point Physics project. Only its completion before M grants
   preparation. Pending final choice, permanent refusal and prototype saves
   never qualify. A canceled project can be funded again; no retroactive reward.
2. At/after configured M, a global monthly/midgame dispatcher reserves a single
   instance regardless of any personal history. It selects an empty, unowned,
   colonyless system with a direct hyperlane to an ordinary non-capital frontier.
   If no such system exists, a saturated-map fallback selects an uninhabited
   ordinary frontier outpost (no upgraded base, no capital, no formation above
   500 fleet power, and an adjacent ordinary non-capital target). No foreign
   asset is replaced or transferred: an existing outpost can only be lost in
   the resulting real battle. An impossible topology remains pending and
   retries once per month, with a log diagnostic.
3. One new `epoch_convergence` country creates an armed immobile anchor and a
   mobile spearhead. Default empires, including AI, subjects and personal
   opt-outs, receive the public report and situation on the next dispatch. New
   countries enter through that same monthly intake while the offensive lives.
4. Initial exposure affects at most one previously unexposed colony per country.
   Cohorts freeze at public intake. The physical exposure marker prevents a
   conquered/seceded world's repeated initial strike. A country whose worlds
   are all already exposed receives no second initial strike. Later colonization
   does not restart the initial quota.
5. Fleet orders select adjacent ordinary non-capital systems, otherwise unowned
   neighbors, and use native hyperlane movement with aggressive combat stance.
   Replanning occurs on arrival, missing destination, or a 180-day timeout;
   engaged/disabled fleets are left alone. No native military or construction AI
   competes with the scripted controller. No scripted occupation/pop deletion.
6. Destroying the real anchor stops all further reinforcements immediately.
   Existing raiders must still be defeated. Only native victim-fleet destruction
   records advance the validator; absence, retreat, stalled orders, elapsed time
   or situation progress cannot resolve it. National credit records only the
   native killer; no invented coalition participation or rewards.
7. The report opens generic counterharmonic research for every enrolled empire:
   300 Energy + an actual 1200-point Physics project, with +10% weapon damage
   for ten years and permanent access to local shielding. Prepared countries
   already have that shielding access. Affected worlds can spend 300 Energy +
   200 Minerals on a 90-day decision reducing the additional crisis overlay to
   −1 stability / −1% job output. Existing features and old damage remain.
8. Anchor destruction plus destruction records for **every spent raiding fleet**
   ends the first offensive exactly once. Existing old-world damage persists;
   research and shielding remain available through a planet decision after the
   situation ends. This is an opening milestone, not Stage-III final victory or
   Stage-IV entitlement. There is no scripted deadline that ends the campaign
   after a player defeat: withdraw, research, rebuild and attack again.

## Initial acceptance parameters

These are explicit implementation values for player acceptance, **not measured
production balance**. ADR-002's larger full-crisis ceilings are not all spawned.

| Parameter | Opening value |
|---|---|
| Physical anchors | 1, no automatic replacement |
| Mobile lifetime spawns | 4 total, including the first formation |
| Simultaneous mobile fleets | At most 3 |
| Reinforcement interval | At least 720 days; living identified anchor required |
| Formation | 12 existing Stage-II corvettes + 6 new destroyers |
| Anchor | Own armed design on native `military_station_small_ai`, speed zero |
| Target search | Adjacent systems, one final fleet-path check per replan |
| Global work | Monthly intake; at most two ranked galaxy placement selections while pending |
| Planet quota | 1 initial colony/country, no repeat on the same physical world |
| Prepared additional overlay | −2 stability, −3% all job output |
| Experienced additional overlay | −4 stability, −7% all job output |
| Uninitiated additional overlay | −8 stability, −12% all job output |
| Colonyless fleet upkeep | Prepared +3%, experienced +8%, uninitiated +15% |

The broad job-output modifier includes research and applies to organic, Hive and
Machine production. An uninitiated world additionally receives the existing
active contamination feature only if it has **no** existing family state and
its owner has neither active old campaigns nor canonical old planetary targets.
The intentionally conservative predicate protects all such owners' worlds,
including active investigations without result flags. No old setter, progression
flag or minimal old carrier flag is written. Otherwise only the overlay applies,
including on a protected one-colony empire. Physical modifiers stay on their
colony after transfer. The original Stage-I/II content is unchanged.

## Country and save support

| Installed native category | Public UI / initial economy | Military interaction |
|---|---|---|
| `default`: regular, Hive, Machine, genocidal, AI, player, subjects | Included equally; personal consent only gates preparation | Hostile faction, real fleets/stations |
| `default` mobile/colonyless origin | Public situation and research; classed ship upkeep instead of invalid capital access | Same fleet interaction |
| Fallen / awakened, marauder, enclave, guardian | No normal-colony strike, private mission or normal reward | No explicit neutrality/combat immunity; native faction interaction remains to test |
| Other crises | No ordinary colony exposure or state override | Native hostility remains to test; no changes to Vanilla crisis data |
| Pre-FTL, observer | No ordinary participant/economy enrollment | Native scope/type rules; no quest/reward grant |
| `epoch_convergence` | Excluded from intake | Own finite operational fleet budget |

The installed country definitions mark only `default` playable; authorities and
subject status do not replace that type. This matrix is a source-based policy,
**not an executed diplomacy/AI compatibility result**.

New games and compatible saves first initialized before M are supported targets.
Installing this implementation for the first time at/after M fails closed with
`epoch_iii_unsupported_late_install` and a game-log explanation; it does not ambush
an existing late campaign. An already initialized III save continues after M.
No SP-only load hook drives the simulation. Persistent global flags/targets own
the singleton; its dedicated country owns numeric budgets. Identity recovery
rebinds only tagged surviving objects. Unknown initialized schemas do not reset.
Missing country/anchor evidence stops unsafe spawning and logs a reference fault;
it neither clones an encounter nor awards a win. A fleet that disappears without
a destruction record remains unresolved. Such engine/identity faults need log
investigation; they are not modeled as a player's military defeat.

## Installed-source checks

The new static test reads the actual installed files and generated docs:
Fingerprints are recorded in the [opening source manifest](../research/stage-iii-opening-source-manifest-2026-11-08.json).

- `events/marauder_events.txt` (`marauder.151`),
  `events/synthetic_dawn_events.txt` (`syndaw.400`): negative relative midgame
  comparisons; generated `triggers.log` documents the relative clock.
- `common/on_actions/00_on_actions.txt`: global monthly/midgame hooks;
  `on_fleet_destroyed_victim` has country root, killer From, victim fleet FromFrom.
- `events/an4_events.txt` (`drones.105`, `drones.110`): native fleet queue and
  system `move_to`; generated docs document clear/queue actions and path checks.
- `common/country_types/00_country_types.txt`, `gray_goo`: hostile faction,
  border access bypass and station attack semantics. III uses its own type and
  scripted strategy; it does not depend on the Tempest's military minister.
- `common/ship_sizes/10_ai_ships.txt`, `military_station_small_ai`: zero-speed
  armed station; `common/global_ship_designs/ai_ship_designs.txt`, `NAME_AI_2`:
  section/component slots. Own anchor uses base-game assets, no L-Gate check.
- `events/astral_planes_events.txt` and generated `has_starbase_size`
  documentation: equality comparison to `starbase_outpost`; the frontier
  fallback does not script ownership or remove that outpost.
- `events/infernals_crisis_events.txt`, `infernals.1000`, and
  `common/special_projects/00_projects_infernals.txt`, `INF_CRISIS_ENTROPY`:
  country-location Physics research with a country-scoped success callback.
  This is interface evidence, not a DLC dependency.
- Existing EPOCH deposit definitions and migration/recovery callers: isolated
  overlay and conservative feature reuse; no old campaign callbacks are invoked.

## Static results and remaining player run

Run `scripts/test_epoch_regressions.ps1 -LogDirectory .stage-iii-no-runtime-logs`
and `git diff --check`. The deliberately nonexistent log folder avoids claiming
old gameplay logs as evidence. The suite includes focused III guard tests,
unchanged old gameplay-content checks, DE/EN validation and installed asset/API
checks. Exact final output is in the linked research transcript.

No Stellaris process, executable fixture, new save, combat run or MP session was
used for this implementation. Runtime probes from the engine contract stay open.
For player acceptance, start a new game or a copy first initialized before M:

1. Use M=2250 and M=2300 in separate runs. With no old participants, verify one
   public outbreak around each configured M. From a qualified Stage-II save,
   compare M−21/M−20/M−1/M, finish versus interrupt the paid prep, and verify no
   consent/preparation after refusal or a pending choice.
2. Save/load before reservation, after spawn and before/after the real anchor
   kill. Observe one enemy/anchor, unchanged budgets and no duplicate impact.
   Repeat with AI, a subject and two host/client participants.
3. Follow actual movement through several hyperlanes, starbase combat, blocked
   or destroyed targets and a player withdrawal. Rebuild and destroy the source;
   wait longer than 720 days and verify no new formation. Defeat all survivors;
   only then must the situation close and the final opening report appear.
4. Compare matched organic/Hive/Machine economies before/after enrollment. Inspect
   an uninitiated one-colony world, protected features, active I/II objectives,
   conquest and secession. Verify stronger actual unprepared losses, preservation
   of old objectives, the research project, real decision cost/time and mitigation.
5. Test a saturated map's outpost fallback and a map with neither safe empty
   space nor a safe outpost (pending rather than capital ambush),
   colonyless empire, simultaneous Vanilla crisis and loss of an objective
   reference. Collect fresh logs and report unresolved identities rather than
   console-completing a military objective.

Open risks: real order/hostility behavior, native dead-fleet callback lifetime,
save/MP dispatch and border semantics; economic presentation and measured balance;
small/saturated topology may delay outbreak; raiders may need pursuit after the
anchor falls. Optional Gigastructures balance is not validated. Full five-chapter
and final multi-front/scientific victory acceptance is outside this PR.
