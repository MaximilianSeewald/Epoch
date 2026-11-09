# Stage IV, Package A: implementation and connected playtest

Implemented in the existing EPOCH mod for installed Cygnus 4.5.3 (4e91).
**Static validation only. No native Stage-IV playthrough, AI campaign, save-file
round trip or multiplayer acceptance has been performed.** Packages B/C remain
unimplemented. This report supplements the approved design without changing it.

## Implemented gameplay

- Monthly, simulation-driven enrollment checks both explicit private
  continuations, validated five-chapter Stage II, permanent refusals and global
  Stage-III victory. An owner-local invitation waits 1,800–3,600 days. Late
  qualifying empires and old post-victory saves start their own delay when first
  observed; no earlier global victory timestamp is invented.
- A personal six-milestone situation advances only through callbacks, a paid
  conversion/recovery, actual construction and authenticated military death.
  The operations approach and capital decision expose funding and recovery.
  Colonyless empires can use the situation approach.
- Two scientist-staffed, located projects use distinct systems and persistent
  per-ship assignments. Inaccessible outstanding locations can be reanchored
  for 300 energy without discarding an already completed measurement.
- A real four-stage archaeological site has scientist/fleet/site guards and
  one-time stage outcomes. Secure preserves a stronger later countermeasure;
  extract gives more immediate research; isolate grants armor. Later stages
  grant actual research stockpiles. A lost site can be replaced for 1,000 energy
  and 300 alloys, restarting physical excavation without repeating rewards.
- Six regular, weighted prototype technologies cost 6,000–10,000 research and
  have actual modifiers. Diagnostics and inversion gate treatment; material
  analysis gates the funded demonstrator; telemetry gates optional preparation.
  Spectroscopy/calibration improve research/surveying and need not both be
  completed to finish the story.
- Three successive native colony decisions diagnose (90 days, 600 energy),
  stabilize (180 days, 1,800 energy/600 alloys) and invert (360 days,
  3,500 energy/1,500 alloys) one existing feature family. Contamination becomes
  a symbiotic matrix, scar a harmonized fold, surviving structure an awakened
  archive. Family cleanup reconciles old deposits, economic flags and modifiers
  while preserving unrelated families, historical outcomes and crisis overlays.
  Foreign live Stage-I/II objectives are protected in both Planet/Colony identity.
  Positive conversion persists through conquest and cannot re-award progression.
- Without a safe owned feature, a 540-day staffed salvage project costs
  6,000 energy/2,500 alloys. It yields reconstruction evidence, never a fabricated
  healed planet. Destroyed structures cannot be revived on their old world.
- Chapter IV first identifies the Architects and UAP. A paid 360-day staffed
  construction project (3,000 energy/4,000 alloys) produces an owned, physical,
  immobile demonstrator station. Careful, experimental and guardian postures
  have different ongoing research/ship effects.
- Each owner receives a separate hostile country, immutable claimant mapping,
  principal ship, fleet and reserved star-only arena. An eligible existing
  system is preferred. Otherwise a star-only initializer is connected by an
  explicit hyperlane to the owner's colony/fleet anchor. No existing assets
  are confiscated. Principal death, not escort cleanup, gates the personal key.
- The native AI large-warship hull carries mixed lance/plasma/laser/PD weapons,
  shields, armor and hardening: fixed 100,000 hull, strong weapon modifiers,
  and additional weapon-only late-year/hard-difficulty scaling. At 70% hull it
  drops hardening, increases fire rate/tracking and deploys eight escorts once;
  at 30% it trades defense for damage. Only the actively fighting boss fleet is
  sampled every five days. There is no galaxy-wide combat polling or timed kill.
- A 300-day preparation at the safe home research location costs
  2,000 energy/800 alloys and reduces boss damage/fire rate. Secured archive
  sequences strengthen it. It neither harms hull nor bypasses the battle.
- Only the victim-side hook with real victim, distinct combatant country and
  attacker ship, matching canonical principal and registered claimant, writes
  `epoch_iv_protocol_key`. Allies may land the final blow. Missing references,
  ownership changes and cleanup fail closed. A failed attack leaves the boss.
- Chapter VI offers exclusive guard/free narrative philosophies and sets
  `epoch_iv_technology_era_eligible`; `epoch_iv_future_research` is the shared
  future gate. No post-boss technologies, perks, trees or infrastructure are
  pretended to be implemented or granted. DE/EN text covers the complete path.

## Native-source evidence and adaptations

Read-only installed sources at `G:/Steam/steamapps/common/Stellaris`:
`events/ancient_relics_arcsite_events_1.txt` (ancrel.14: spawn and explicit
hyperlane repair), `common/solar_system_initializers/special_system_initializers.txt`
(central-star initializer), `common/archaeological_site_types/00_base_game_arc_sites.txt`
(four stage/fleet/scientist/failure callbacks), `common/on_actions/00_on_actions.txt`
(victim ship identity and both entering-battle directions),
`common/ship_sizes/10_ai_ships.txt`, `common/global_ship_designs/ai_ship_designs.txt`
and existing generated `logs/script_documentation/{effects,triggers}.log`
(`create_ship`, `repair_ship`, `has_hp`, `abort_special_project`, deposit effects).

Material adaptations/limits for review:

- Midfight weapons are represented by real fire-rate/tracking/damage changes
  and one escort deployment, rather than unverified live section refitting.
  Five-day absolute hull checks use the source-backed fixed 2,000 × 50 hull;
  weapons alone scale with year/difficulty. Unrelated mods changing this hull
  or its health modifiers could shift the nominal 70/30 thresholds.
- The no-feature route also handles lost/destroyed/foreign original sites.
  Package A does not reconstruct a destroyed structure on a different colony;
  it uses the explicitly allowed, more expensive ship-recovery alternative.
- Native lost-ship/scientist replacement retains an existing project. Changing
  its work location costs 500 energy, cancels the outstanding assignment and
  requires funding/researching it again; no sunk-cost refund. A blocked archive
  restarts all four physical stages; old stage rewards remain exactly-once.
- A generated archive may need an outpost before native excavation. Generated
  systems, UI access outside borders, pathing and AI task choice require the
  connected native test. Colonyless participation still needs an actual fleet
  and a scientist, and potentially an outpost for its archaeological site.
- Unexpected removal of the registered guardian produces **no** victory and
  **no** replacement guardian. This is deliberate fail-closed behavior, not a
  supported normal recovery scenario. Ordinary combat defeat is recoverable.
- Surviving escorts are real hostiles; their destruction is optional and they
  are not silently removed when the principal dies.
- Balance is provisional. The intended 3–4× Stage-III commander encounter is
  not a measured fleet-power or battle result. System insertion, combat phases,
  physical station display, native scopes, save serialization and MP/OOS remain
  runtime risks until tested. There are no executable probes or extra mods.

## Static validation

Run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test_epoch_regressions.ps1`.
The suite includes the new `scripts/test_stage_iv.cjs`: parsed eligibility,
foreign final blows, duplicate/missing/wrong principal kills, owner isolation,
all 14 eligible old feature states, destroyed structure exclusion, foreign live
Planet/Colony mission guards, stale project callbacks, no timer/cleanup victory,
six technologies/milestones, four native dig stages and installed source checks.
These tests intentionally do not emulate Stellaris combat or networking.

The older personal-source isolation assertion now excludes the new ascension
files as well as the crisis files. Narrative checks permit the funded in-world
prototype vocabulary in Stage IV while retaining earlier restrictions.
Existing historical runtime logs printed by the runner are not new evidence.

Final static run (2026-11-09): 709 runner checks passed, including 5,287
Stage-I flow assertions, 1,212 Resonance assertions, 33 native-source checks,
2,745 narrative/UI assertions, 2,027 Stage-III assertions and 170 targeted
Stage-IV assertions. All 54 Clausewitz files parsed; maximum scripted-effect
expansion depth is three. `git diff --check` passed.

## One connected in-game test

1. Load a **copy** of the successfully completed Stage-III campaign under 4.5.3
   with this branch of the existing EPOCH mod. Keep the original save. Use an
   empire that explicitly continued both earlier stages; prepare a second such
   empire in the same galaxy if available. Do not set completion, kill or key
   flags with the console. Advance the normal invitation delay (5–10 years
   after enrollment); public crisis-only participants/refusers must not enter.
2. Choose an analysis posture. Check its real modifier, six-step situation and
   two project markers in different systems. Research the offered prototypes
   through normal research. Complete both staffed ship investigations. Replace
   a scientist once using the ordinary assignment UI; no free progress should
   occur. Save/reload between the two measurements and retain the first result.
3. Excavate the revealed archive with a scientist through **all four native
   stages**, claiming the system first if required. Choose secure, extract or
   isolate and inspect the research/modifier result. No Architects/UAP reveal
   should precede Chapter IV. If access is lost, use the paid operations recovery;
   the new site restarts excavation and previously earned rewards do not repeat.
4. Research Diagnostics and Inversion. On an eligible own old EPOCH colony enact
   diagnosis → stabilization → inversion and inspect every actual cost/time.
   Confirm exactly one positive family replaces its old states, unrelated
   features/crisis damage stay and Chapter IV opens. Save/reload after treatment.
   In a no-valid-feature run use the funded salvage project instead; it must
   require real staffed research and create no fictitious healed feature.
5. Read Chapter IV's first Architects/UAP disclosure. Research Material Analysis,
   fund the demonstrator through operations and perform its 360-day staffed
   project. Verify the owned immobile station physically appears and only then
   Chapter V/the hostile personal instance opens. Inspect the arena: central
   star only, no ordinary planets/moons/colonies or stolen assets, usable hyperlane.
6. Optionally research Telemetry and fund/complete its project **at the safe
   research location**, observing the boss's real reduced damage/fire rate.
   Attack the marked personal boss with real fleets. Inspect its 70/30 hull
   transitions and bounded escort wave. Retreat once if practical, rebuild,
   save/reload and reengage: the same boss persists and no key is awarded early.
7. Destroy the principal in actual combat, optionally with an ally delivering
   the final shot. Chapter VI must appear only for its registered owner, once,
   without waiting for escorts. Select one philosophy. Verify the situation
   ends, the personal key and future eligibility persist after save/reload, and
   no 36-tech/perk/building bundle is granted. The other empire's different boss
   and incomplete progress must remain intact. Record native `error.log` and
   battle observations; host/client synchronization needs a real MP run.

Do not merge until this connected native campaign is accepted.
