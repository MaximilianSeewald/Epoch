# Stage IV Package A: first-playtest corrections (PR #17)

The existing Stage-IV campaign was played successfully through projects,
archaeology, planetary healing, demonstrator construction and the Adjudicator.
This bundled correction stays on feature/stage-iv-ascension-a. PR #17 remains
Draft and unmerged. No new mod, feature branch or full native playthrough.

## Victory and existing saves

Vanilla 4.5.3 documents on_ship_destroyed_victim as ROOT = victim owner,
FROM = attacker owner, FROMFROM = destroyed ship, FROMFROMFROM = attacker ship.
The existing logs show .45 and .53, but no visible .60. Hidden .50 was not logged;
the exact failed predicate cannot be reconstructed from these files alone.

Unlike the working Stage-III .41 validator, the former .50 required an extant
principal event target and a battle-entry marker. Its missing-attacker fallback
also depended on the dying fleet still reporting combat. Targets and battle
state can disappear before validation. These extra dependencies are removed;
missing attacker references now fail closed, matching Stage III.

The native callback must identify the principal ship, its immutable personal
claimant tag, a currently eligible Chapter-V claimant, and an authorized native
attacker ship whose owner matches FROM. Claimant/federation/defense partner/
direct subject or overlord qualify. Independent kills, script kills without
an attacker, retired countries and repeated callbacks cannot award a key.
Only .50 writes the personal key, advances to Chapter VI and schedules .60.
Detailed acceptance/rejection reasons go to game.log only.

A vanished judge without reliable proof is not retroactively rewarded. Monthly
checks automatically introduce the existing paid reconstruction (2,000 energy,
4,000 alloys; at most two replacements). Principal references and immutable tags
still prevent duplicate living bosses; retirement precedes replacement.

## Encounter and progression

- Principal: 240,000 hull, 149,760 armor, 150,696 shields including the booster.
  Previous values: 60,000 / 37,440 / 38,376. Tachyon lance, kinetic artillery,
  plasma, medium lasers and upgraded PD give mixed shield/armor damage.
- Native baseline comparison: a titan has 20,000 hull, a battleship 4,800.
  The actual Stage-III command encounter uses the same base AI hull plus 36
  enforcers; late-normal combined hull is 61,020 after its +35% hull tier.
  Raw pools and source arithmetic are not measured combat difficulty.
- Three persistent phases use native hull percentages: hardened opening,
  verdict below 70% (+rate/tracking), overload below 30% (+damage/rate, weaker
  defenses). One wave of twelve upgraded, reinforced destroyers appears at 70%.
  No recurring spawn or hull regeneration. Escorts withdraw after victory and
  disperse after 120 days; cleanup has no victory authority.
- Initial weapon throughput is 12 x 1.5 = 18 times the unmodified new loadout.
  Countermeasures reduce it to 7.5 x 1.2 = 9 (50% less); secured data give
  6.9 x 1.2 = 8.28 (54% less). Damage types, hit chances and tactics still matter.
- Guardian display uses native create_fleet settings.is_boss, as in Vanilla
  Stellarite/Wraith events. Existing fleets receive set_fleet_settings once.
  Existing ship equipment is not retroactively rebuilt; use a pre-summon save
  or a legitimate recovery instance to assess the full new design.
- Chapter IV automatically presents construction even without research or
  resources. Material research prompts once; visibility and native allow checks
  are separate. Location selection and full payment precede project start.
- Manual operations live only in the capital's planetary decision. Empires
  without a capital receive an event fallback every 180 days. Six descriptions
  explain discovery, purpose and the immediate objective without early reveals.

## Planetary and Stage-III repairs

Diagnosis/stabilization/inversion retain their real costs and 90/180/360-day
execution times. Native previews show the treated family, actual removed deposit,
resulting positive deposit and its bonuses. Each coexisting family pays separately.
Independent emergency damage and unrelated features remain. A clean matrix gives
+10% jobs/+5 stability/+5% habitability; independent emergency damage leaves net
+5% jobs/+2 stability/+5% habitability. Fold: +15% each research/+5 stability;
archive: +15% each research/+10% unity. Existing provenance checks are preserved.

Invalid planet_habitability_add becomes native pop_environment_tolerance.
Every Phase-II triggered-deposit owner switch checks exists = owner first,
matching Vanilla's guarded planetary deposit pattern; all old class modifiers
remain identical. Four spawned-system connections use Vanilla's exact
has_hyperlane_to guard. Target clearing checks existence. Missing situation
keys and empty observation approaches are repaired, including on_select tooltips.

Preparation completion .20 now closes only epoch_iii_preparations and sends .22.
Prepared legacy situations also abort. The relative midgame trigger, global
crisis enrollment and behavior for unprepared empires remain unchanged.

## Verification and focused save checks

Full existing runner: 709 checks passed; Stage I 5,287; Resonance 1,218;
installed-source checks 33; narrative/UI 2,847; Stage III 2,042; Stage IV 634.
All 54 Clausewitz files parse; maximum effect-expansion depth is three.
Sources checked directly against installed Cygnus 4.5.3 and generated script docs.
Historical log errors are pre-fix evidence, not a new engine run.

1. Copy a pre-death or pre-summon save. Win an authorized real battle: one key,
   Chapter VI and final choice, with no wait for escorts. Inspect game.log's
   EPOCH IV death diagnostics. Check save/reload after the final choice.
2. Copy the post-death stalled save. Within a monthly pulse expect the recovery
   proposal, no free key. Pay, defeat the replacement, verify completion once.
3. Copy a Chapter-IV or pre-healing save. With inadequate resources inspect the
   visible disabled build action; research materials and check the automatic
   proposal. Fund once, complete staffed construction. Inspect family-specific
   planetary previews, actual costs and remaining independent burdens.
4. Copy a save before preparation completion: the report and situation close,
   with no crisis before configured midgame. Without completing preparation,
   the normal midgame enrollment still applies.

Native callback lifetime/order, actual battle balance, phase sampling, fleet
pathing, UI rendering, save serialization, AI and multiplayer/OOS remain runtime
risks. No full new in-game test series was performed or requested.
