# Stage IV Package A: implementation and bundled review corrections

**Code implemented; static evidence only. No native Stage-IV playthrough,
AI campaign, save-file round trip or multiplayer acceptance has been performed.**
Work remains in PR #17 and the existing mod/feature branch. B/C remain unimplemented.
This report supersedes the initial Package-A implementation notes. The existing
connected test sequence is retained for the later user test; no new test is requested.

## Bundled review corrections

- Personal eligibility, six chapters, staffed projects, four native excavation
  stages, six research technologies, paid demonstrator and future research gate
  remain. No Stage-I–III gameplay file is changed.
- The ship-death hook validates the registered principal and claimant. A native
  entering-battle certificate and an authorized killer country are required:
  claimant, federation/defense partner, direct subject or direct overlord. A
  research pact, border access or an independent third-party kill does not qualify.
  When FROMFROMFROM is valid its owner must match FROM; when it is absent, the
  registered victim must still belong to an in-combat fleet. A missing attacker
  ship alone no longer excludes a genuine, otherwise certified battle. Only this
  victim callback writes a key; timers and missing objects cannot grant one.
- Conversion is permanent **per family**, using terminal flags plus positive
  deposits. Diagnosis/stabilization are owner-keyed and consumed after each
  conversion. Two or three coexisting families require the full three decisions
  and costs for each family. One story-completion flag prevents repeated rewards.
- Missing guardians have up to **two** paid replacements (2,000 energy and 4,000
  alloys each). Recovery requires no key/victory record and no extant principal
  by either canonical reference, enemy fleet search or immutable owner-keyed ship
  tag, including transferred ships. The old country is retired before spawning a
  new real opponent. Existing preparations carry over. A placement failure leaves
  the normal summon retry available; it never awards completion.
- Stage III and the judge use the same native large AI hull and core weapons:
  lance, two large plasma, three medium gamma lasers and PD. An invalid old
  SHIELD_CAPACITOR identifier is replaced by source-backed SHIELD_BOOSTER.
  The careful research posture now uses native all_technology_research_speed.
- The judge now has **60,000 hull** (2,000 × 30), **37,440 armor**
  (four tier-V large armor × 2,340 × 4) and **38,376 shields**
  (four tier-V large shields × 2,340 × 4.1, including booster).
  Initial damage is ×8 with +25% rate, rather than ×36 with ×16 armor/×26
  shields. Late/hard scaling adds +0.8/+0.6 damage modifiers and hard +10% rate.
  For comparison, Stage III late-normal command hull is 2,700, armor/shields
  9,360 each; its 36 enforcers bring combined hull to 61,020, armor to 32,400
  and shields to 20,880. These are raw source-derived pools, **not** effective
  fleet power, equal weapon DPS or measured encounter difficulty.
- Normal opening weapon throughput is 8 × 1.25 = 10 times the unmodified shared
  principal loadout. Preparation reduces it to 5.6 × 1.05 = 5.88: **41.2% less**.
  Secured archive data reduce it to 5 × 1.05 = 5.25: **47.5% less**. Late/hard/
  final-phase reductions vary (still roughly 32% or more without secured data).
  Damage types, accuracy, target size, shields, hardening, repair and AI tactics
  remain outside this arithmetic; no 3–4× combined encounter claim is made.
- At 42,000/18,000 hull the ordered, independent checks traverse both phases
  even after a large damage jump. Eight escorts spawn once in a separate fleet,
  without principal durability. They receive departure orders after principal
  death (including an unclaimed kill), then disperse after 120 days. Cleanup
  has no victory authority. Five-day sampling can skip a phase only if the
  principal dies before a sample; it never prevents an authenticated victory.
- Excavation stage III now offers preserved field-lens data (stronger shields
  countermeasure after the actual research project) versus immediate +10% fleet
  weapon range. Both choice stages show only a replay/retain option when already
  recorded, so relocation cannot change an earlier decision.
- Six distinct installed situation icons, distinct concise objectives, automatic
  operations-button reset, native resource/modifier effects and class-specific
  UAP/finale text replace repeated placeholders and technical narrative prose.
  Early choices do not advertise later boss countermeasures. The stationary
  demonstrator uses native aggro settings, with no fleet stance/order assumption.
- AI opens operations only for available work, not while merely waiting. Projects
  retain native AI_wait_days and staffed requirements; colony decisions retain
  real costs and AI weights. An eligible AI may commit a military fleet over
  30,000 power using native auto_follow_fleet with attack_fleet = yes. It retries
  after loss of that fleet. No AI combat result or archaeological roll is faked.

## Healing: removed burdens and retained consequences

Contamination clears its old deposits/state modifiers, Stage-II resonance
modifiers and completed quarantine. It clears initial Stage-III pressure variants
only with epoch_iii_exposed_v1 provenance. Imported contamination with
feature_added + scar_exposed clears the imported scar-pressure overlay only if
no actual scar family remains. Associated rising/severe/containment overlays are
removed only with matching provenance or after the remaining relevant family ends.

Scar clears its three deposits, legacy class scar modifiers and the scar's
exacerbated burden, plus scar-pressure/shielded overlays. It clears shared worsening
only when no contamination remains. Structure clears only its four old structure
states/modifiers. Other families and every live older mission remain protected.

The independent emergency choice epoch_res_permanent_damage (-5% jobs/-3 stability),
temporary extraction (+15% physics/-3 stability), unrelated devastation and
country-level conclusion choices/fallbacks remain. Clean matrix: +10% jobs/+5
stability/+5% habitability; fold: +15% each research/+5 stability; archive: +15%
each research/+10% unity. With emergency damage, matrix nets +5% jobs/+2 stability,
fold nets +10% research/+2 stability, and archive nets +10% research/+5% unity.
Temporary extraction may still lower stability until expiry; it is an independent
paid exploitation tradeoff, not an untreated contamination flag.

## Evidence and remaining runtime risks

Read-only installed Cygnus 4.5.3 sources: on_actions/00_on_actions.txt (victim and
both battle directions); generated effects/triggers docs (auto_follow_fleet,
aggro, stance, has_hp and identity); situation_log.gfx (icons 1–6); native four-stage
archaeology; AI ship sizes/designs, component templates and scripted component
variables. The full existing regression runner and targeted parsed tests are used.

Static tests model eligibility, diplomacy, missing attacker ships, independent
kills, duplicate keys, multi-family costs/net effects, missing/referenced/transferred
principal recovery, large hull jumps, once-only escorts, replay guards and AI/UI
access. Native placement, callback destruction ordering, withdrawal/pathing,
actual damage/balance, scientist assignment/excavation/outpost AI behavior,
save serialization and MP/OOS are **unverified**. The AI attack command is source-
checked; this is not evidence that an AI has completed its campaign.

Final correction run: all **709** runner checks passed, including **309** targeted
Stage-IV assertions, 5,287 Stage-I, 1,216 Resonance, 33 installed-source,
2,776 narrative/UI and 2,027 Stage-III assertions. All 54 Clausewitz files parse;
maximum scripted-effect depth is three. Whitespace checks pass. Historical logs
printed by the runner are not evidence from a new game session.

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
   other-family burdens and independent emergency/extraction costs stay and Chapter IV opens. Repeat the three paid decisions for other families on the same world; the story advances only once. Save/reload after treatment.
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
7. Destroy the principal in actual combat, optionally with a federation/defense partner or direct subject/overlord delivering
   the final shot. Chapter VI must appear only for its registered owner, once,
   without waiting for escorts. Select one philosophy. Verify the situation
   ends, the personal key and future eligibility persist after save/reload, and
   no 36-tech/perk/building bundle is granted. The other empire's different boss
   and incomplete progress must remain intact. Record native `error.log` and
   battle observations; host/client synchronization needs a real MP run.

Do not merge until this connected native campaign is accepted.
