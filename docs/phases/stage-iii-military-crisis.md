# Stage III – The Nullwarden Convergence

**Status: Binding design specification; NOT implemented or engine-validated.** Target: Stellaris 4.5.3 (current EPOCH base). Stage III is an actual galaxy-wide midgame crisis, not a private continuation of an empire's Stage-II situation. The design follows [EPOCH Architecture](../architecture.md), [galactic-crisis ADR](../architecture/adr-001-galactic-crisis.md), [story outline](stage-iii-narrative-outline.md), [implementation plan](stage-iii-implementation-plan.md), [engine contract](stage-iii-engine-contract.md), and [acceptance](stage-iii-acceptance.md).

The [integration policy ADR-002](../architecture/adr-002-stage-iii-integration.md) defines the normative protected-world fallback, active Stage-I/II isolation, save support, safe placement, strategic scope and shared victory validator. The [evidence register](stage-iii-engine-evidence.md) separates installed source observations from still-required runtime proof. This specification is planning only; gameplay and executable probes require separate user authorization.

## 1. Non-negotiable player requirements

1. The Nullwarden response escalates into **one galaxy-wide crisis**, with actual ships, fleets, systems, anchors, battles and planetary effects. Time alone never counts as a victorious objective.
2. **Every spacefaring empire can be affected**, regardless of participation in Stages I or II, organic/Hive/Machine type, AI/human control, or earlier refusal of the personal EPOCH storyline. No existing Stage I/II flag is a prerequisite for global crisis activation or generic exposure.
3. Empires without completed Stage-II knowledge and early preparation suffer **greater initial planetary harm**. They receive real pre-existing EPOCH feature-family states where narratively/physically valid, even if they never previously encountered EPOCH. Previously contained, controlled, studied, or healed states on any empire are not reset; active Stage-I/II objectives are protected. Where no conflict-free existing-family transition is possible, apply a real supplementary crisis modifier under ADR-002 I01, including a one-colony uninitiated empire.
4. The full military outbreak takes place **around the configured galaxy Mid-Game Start Year**, not at a fixed year. Completed Stage-II participants who explicitly continued can begin optional preparation **up to ~20 in-game years earlier**. No completed Stage II means no privileged early warning/preparation. Global outbreak is never delayed just because nobody completed Stage II.
5. Stages I and II remain country-local and their content, costs, rewards, clock and permanent storyline opt-out stay intact. Stage III is an intentionally new global layer. An opted-out empire is exempt from personal EPOCH missions and Stage-IV entitlement, **not** immune to galaxy-wide combat, planetary damage or public crisis alerts.
6. Stage IV remains the only stage permitted to reveal the Architects' actual purpose and the Universal Ascension Protocol. Stage III must preserve the mystery and inherited costs.

## 2. Terminology and scope of 'every empire'

The crisis broadcasts to, threatens, and can affect **all ordinary spacefaring empires, including subjects and vassals**, player and AI, including regular biological, Hive and Machine empires, regardless of past EPOCH status. Newly created eligible empires are registered when they appear. The real combat layer occupies shared galactic space and can interact with any other present fleet or system.

Special country types (Fallen/Awakened Empires, marauders, enclaves, primitives, guardians, other crisis entities) require an explicit 4.5.3 eligibility and diplomatic-interaction table before implementation. They must not be arbitrarily treated as normal colonies or awarded personal quest chains. Existing spacefaring powers must not receive a blanket *combat immunity*: where vanilla country semantics prevent a feature or diplomatic interaction, document and test a safely scoped alternative. Pre-FTL worlds without a spacefaring owner are not assumed to be empires.

## 3. Crisis clock and Stage-II preparation

Let **M** be the galaxy's *configured* Mid-Game Start Year. Default 2300 is only an example. Let **P = M − 20 in-game years**.

| Window | World behavior | Qualified Stage-II participants | Everyone else |
|---|---|---|---|
| Before P | No new Stage-III crisis objects or early knowledge | Stage II may continue/finish; its existing consequences remain | No Stage-III personal content |
| P to M | Quiet preparation, no galaxy-wide war | Only `epoch_res_complete` **and** explicit `epoch_res_stage_iii_ready` (plus not permanently opted out) unlock the preparation situation, projects and infrastructure. Late completions may join with remaining time; no backdated rewards | Normal play; no early EPOCH warning or preparation access |
| M through M + 1 year | Single galaxy-wide activation, with bounded retry if a safe spawn site cannot immediately be found; unsafe topology may delay activation beyond M+1 under ADR-002 I04 | Early preparedness affects initial exposure and defenses | Stronger initial exposure; generic public crisis information and defensive agency |
| During crisis | Real operational fronts, anchor networks, attack fleets and planetary states | Personal knowledge may yield useful alternatives; no automatic win | Generic research, defenses and coalition participation become possible without Stage-II history |
| Post-crisis | Global military pressure ends; local scars and consequences remain | Personal Stage-IV access still needs an explicit qualified continuation, not merely global victory | Cannot bypass permanent personal opt-out through global victory |

**Consent proof:** preparation also requires a supported personal state, the existing `epoch_res_final_choice_v1` record and no `epoch_res_final_choice_pending`; a legacy ready flag without the final-choice proof cannot infer consent. Current main already records this, so no Stage-II callback/migration change is needed.

**Gate invariant:** `global_crisis_activated` must never require any participant's Stage-II completion. `early_preparation_eligible` requires the existing Stage-II completion/continuation state. A storyline opt-out blocks only the optional personalized path, not crisis exposure. Earlier Stage-I-only completion is insufficient for privileged preparation.

**Source-supported candidate, runtime unverified:** Installed Vanilla uses `mid_game_years_passed >= -10` in `marauder.151` and `syndaw.400`; generated documentation exposes the configured setting. Use the candidate relative window `>= -20` and `< 0`, with global outbreak `>= 0`, only after AP1 verifies exact boundaries, hooks and save/MP behavior. Prefer cheap monthly guarding plus the midgame hook; no fixed date or guessed setting units. See Q02–Q06 in the [evidence register](stage-iii-engine-evidence.md). An unsupported runtime mechanism blocks the gate and requires an evidence-based alternative.

Global activation is idempotent and owned by one authoritative galaxy-level coordinator, with durable single-activation and recovery markers. Yearly or suitably bounded event checks may repair missed dispatch; they never create duplicates. A configurable crisis toggle (if introduced) is a separate, explicitly documented game-rule design decision, not an assumed prerequisite. Native endgame crises and vanilla midgame crises must not be disabled or overridden.

## 4. Threat design: five connected chapters

### Chapter 1 — The Answering Signal / Die Gegenantwort

*Player knowledge:* instruments register previously impossible correlations. Experienced empires recognize fragments, but not their meaning. Uninitiated empires see only inexplicable signal distortions.

- **Real play:** early participants can pursue precursor recordings, build defensive monitoring, and obtain narrow tactical knowledge in the 20-year preparation window. After M all empires receive the real disturbance, first recon elements and local operational information.
- **No spoiler:** do not announce the forthcoming number of anchors, final enemy ship, or ultimate solution.
- **Transition:** actual reconnaissance/first incursion establishes the shared crisis instance; early preparation results are persistent but optional.

### Chapter 2 — The Silent Borders / Die schweigenden Grenzen

Nullwarden fleets create interdicting fronts away from unprepared capitals. They traverse real hyperlanes, threaten installations, and protect growing anchor sites.

- **Real play:** mobile attack fleets, defenses and territory pressure; version-1 territorial pressure consists of validated fleet/installation attacks and planetary hazards. Ground occupation is not part of the baseline; any later control transfer requires separately validated vanilla-compatible combat/occupation mechanics (ADR-002 I06). Planets experience genuine economic/security consequences.
- **Response:** reinforce choke points, evacuate or shield civilians, fight for threatened systems, coordinate with allies.
- **Transition:** at least one authentic anchor/route is secured or destroyed and the crisis has established a meaningful strategic footprint, not merely an elapsed timer.

### Chapter 3 — The Three Foci / Die drei Brennpunkte

Three distinguishable functions are traced in the interference: interdiction, planetary scar propagation, and reinforcement coordination. The story does not explain their original purpose.

- **Interdiction front:** heavily guarded anchor; real defensive station and fleet, contested access and logistics.
- **Scar front:** real owned planets and nearby systems are affected by existing EPOCH contamination/scar family states, with class-compatible economic effects. Resolve or mitigate with actual decisions/buildings/projects. No arbitrary pop deletion or unbounded spread.
- **Signal front:** protected relay enables bounded reinforcements. The relay is a real destructible or scientifically deactivatable object. Capture is optional and cannot be claimed without a separately validated ownership/control mechanic.
- **Interdependence:** destroying or disabling a relay **actually** reduces future reinforcements; securing a scar site lowers local hazard; military success unlocks previously inaccessible scientific work.

There are three **functional roles**, not necessarily precisely three physical fronts in every galaxy. Small maps may expose two suitable anchor systems with combined functions; larger maps may have four stations but no more than the defined bounded budget. The global victory contract always requires all remaining active anchor *functions* to be disabled.

### Chapter 4 — Convergence / Die Konvergenz

Coordinated attack waves reveal a defended command formation. Coordination strength depends on still-active anchors and on actual events elsewhere.

- **Real play:** mobile Nullwarden fleets with a proved target-selection and pathing policy, meaningful retreat/rebuild, a powerful command ship, galactic contributions and decisive military/scientific opportunities.
- **No magical victory:** a Situation progress value alone cannot destroy fleets, disable an anchor, or mark the galaxy safe.
- **Escalation cap:** every wave and reinforcement is linked to a finite operational source, replacement allowance and global fleet budget. No infinite unbounded spawning.

### Chapter 5 — The Last Order / Der letzte Befehl

The remaining machinery yields fragments of a command whose authors and purpose remain unclear.

- **Real play:** completion requires one of the verified global victory routes in §7; rebuilding and delaying remain possible after defeats.
- **Outcome:** global military pressure ends, active Nullwarden combat/anchor objects are cleaned safely, national credit and losses are recorded once, permanent prior damage remains. Affected empires may still have contamination or structural scars.
- **Narrative:** only current observations and consequences. Stage IV/UAP must not be described in player text.

## 5. Fleet, anchor and strategic AI contract

- One distinct Nullwarden crisis country or validated crisis ownership model controls the shared threat; **not** one crisis force per empire. Reuse suitable Stage-II visual identity but do not mistake its stationary `set_aggro_range` behavior for strategic invasion AI.
- Four roles: **Hunters** (fast reconnaissance/raids), **Enforcers** (front-line fleets), **Anchors** (actual stations/defended relay objects), **Silent Commandant** (unique command formation).
- Each created fleet/object has a durable unique crisis identity, assigned operational owner/front, active status, and guarded cleanup/recovery. Spawn only into valid, path-accessible, not trivially fatal start locations. No unsupported jump or unavoidable capital ambush.
- Required proof before content proliferation: ships can follow actual paths and attack valid targets; reinforcement sources can spawn/stop fleets; losses, retreat and target destruction are detected via real native outcomes; recovery after save/load does not duplicate vessels or capture foreign fleets.
- Combat attribution for coalition effects cannot rely on one empire owning a final blow; use source-verified participant/target evidence. If allied contribution cannot be proven safely, record a conservative contribution rather than invent a personal kill.
- Strategic AI selection: deterministic/ranked candidates, bounded search, no per-tick galaxy-wide scan, replan on defined events, prevent endless teleport/idle loops, respect closed borders/war/diplomacy semantics that Vanilla actually supports. NPC invasion country type and war mechanics must be **validated before** final selection; scripted orders are fallback only if they still produce real travel/combat and readable warfronts.

## 6. Universal initial exposure and preparedness

### Cohorts (country-local, frozen at first enrollment)

| Cohort | Evidence | Initial impact | Preparation |
|---|---|---|---|
| **Prepared** | Stage II completed, explicitly continued, and real pre-M defenses/projects achieved | Lower added exposure; already earned protection applies; still threatened by real fleets and hazards | Early 20-year window, paid work only |
| **Experienced but unprepared** | Stage II completed and continued, but no completed prep | Medium exposure | Can perform generic crisis research after M |
| **Uninitiated** | All other ordinary empires: never started, Stage-I-only, incomplete Stage II, or permanent personal opt-out | **Higher** initial exposure, more vulnerable planets and slower initial threat recognition | No pre-M privileged missions; after M generic anti-crisis actions available |

### Planetary effect invariants

- Apply real EPOCH **Resonance Contamination**, **Resonance Scar**, and, only where physically represented by a valid object, **Silent Structure** states through the established shared planetary-feature system. Avoid introducing a fourth competing feature family purely to signal Stage III.
- Every ordinary empire with at least one valid owned colony must receive a **non-zero crisis effect** at outbreak; the prepared group may experience a smaller temporary crisis hazard rather than having a healed/controlled feature overwritten. A spacefaring empire with no eligible colony is still exposed via real fleets/systems or another valid gameplay effect.
- Uninitiated empires receive *more severe aggregate* new effects than an otherwise comparable prepared empire (e.g., more initially affected colonies and/or worse starting contamination state). At least one actual owned world must acquire an existing contamination-family feature whenever **conflict-free eligible under ADR-002 I01**. If every world is protected, already occupies the family or is an active Stage-I/II objective, use a real supplementary crisis modifier instead; never force a family overwrite to satisfy this rule. **Never** assume a colony count of at least two.
- **Preserve player work:** do not downgrade a previously `controlled`, `contained`, `studied`, or `healed` state by reusing the same site; select another valid world or use an additive temporary crisis modifier with real effects. Old effects on scar/structure families are independent. A planet may have at most one visible state from each family at a time. Never add unrelated deposits to a foreign world or create false archaeological sites.
- Only actual EPOCH crisis events create/modify Stage-III exposure. A general galaxy activation does not fabricate completed Stage-I/II investigations or grant their story rewards. No replay of earlier planetary choices.
- Class-aware mechanics: biological, Hive and Machine empires use effects consistent with the existing Stage-I/II feature conventions, without making gestalts immune.
- On planet loss, destruction or transfer, ownership must be checked at action time. Existing damage may remain with the world where appropriate; the new owner does not inherit another country's personal campaign rewards.

### Suggested initial tuning — NOT balance-locked

With one valid colony: Prepared = a small, non-zero local crisis impact; Uninitiated = one active/resonant contamination feature or equivalent appropriately stronger economic hazard. With 2–4 colonies: Prepared = at most one new mild impact; Uninitiated = 1–2 impacted colonies. With 5+ colonies: Prepared = 1–2 impacts, Uninitiated = 2–3 impacts. Experienced but unprepared falls between. Cap planetary exposure per empire, avoid overlapping target selection, and compare **aggregate real economic harm**, not number of icons alone. Precise strengths/durations are deferred to Stage-III balancing and source checks. These are design bands, not hardcoded script numbers.

## 7. Three genuine global resolution routes

| Route | Required real objectives | Distinct outcome |
|---|---|---|
| **Military breakthrough** | Neutralize every active anchor function; genuinely destroy the command formation in a validated final battle | Strong wreck/salvage opportunity, high expected losses |
| **Scientific interruption** | Secure access to at least two distinct anchor functions via real military/strategic actions; complete research at at least two genuine physical sites and a final key-node operation that disables every remaining function and physically deactivates/withdraws the command network | Can deactivate/withdraw command network without inventing destruction, at substantial research/infrastructure cost; some damage remains |
| **Joint containment** | Cooperative defense and anchor operations with independently proven contributions from at least two empires satisfy the same military or scientific physical shutdown objectives, through one shared validator | Distributed effort, asymmetric national credit and losses; not a third free timer victory |

Joint containment is a cooperation mode, not a separate timer/counter victory predicate. A solo or isolated empire can use the military or scientific procedure without coalition membership.

No route may finish by paying a single resource at an event, waiting a countdown, deleting a target reference, or using an unverified fight callback. Cases where a station is lost/inaccessible need bounded replacement or alternative real targets, not automatic objective credit. The game ends the **crisis**, not the player's EPOCH storyline automatically.

## 8. One crisis, separate country records and credit

- **Global:** single activation ID/schema; crisis phase; crisis country; bounded anchor/front/fleet registry and command state; global victory and cleanup flags; global clocks and spawn budget.
- **Country:** previous Stage I/II history; early eligibility and actual preparations; infection/shielding records; project status; individual participation and losses; personal Stage-IV eligibility/opt-out.
- **Planet/system/fleet:** real owner and physical identity, specific hazard/anchor state, associated global crisis object ID and lifetime; individual rewards require current scope and validated attribution.
- The galaxy's overall phase is authoritative. An empire cannot restart the global crisis using a capital decision. An enemy fleet killed by one ally disappears for everyone; global progress is shared while national credit is separately protected.
- Any eligible normal country, including a new country formed after M, is enrolled in the current global phase with relevant local exposure/defense; **never** spawns a second crisis.
- Explicitly distinguish `global crisis defeat` from `country was devastated`, `country helped win`, and `personal Stage III/IV story resolved`.
- Previous permanent personal refusal survives intact and excludes personalized Stage-III prep/Stage-IV access, not galactic invasion, hazards or generic civilian alerts. This supersedes only the prior blanket meaning of *no later EPOCH objects* once they are consequences of a galaxy-wide crisis.

## 9. Information, narrative and player UX

- Current in-world observation only; no exact next-wave timetable, no Stage names, no mod/Handoff/Flag/Variable jargon, no spoilers for the Architects or UAP.
- Pre-M personal briefing only for qualified empires; M crisis outbreak conveyed by a neutral public galactic report to all empires. Opted-out empires may receive that generic public report but not personal discovery missions.
- Global situation reports observable active fronts/objectives, while country-local situations/decisions represent preparation, containment and concrete research. Avoid showing dozens of mirrored global situations.
- In-game resource costs, modifiers, devastation and feature effects use native tooltips/features wherever supported; do not narrate numbers in prose. English and German localizations are required.
- Every major enemy action is visually traceable to a real location; the UI must explain what is currently threatened without revealing the intended final solution.

## 10. Fairness, compatibility, and acceptance gate

- Crisis must be dangerous to prepared powers but not a game-ending unavoidable ambush against an uninitiated one-colony empire. Threat scaling considers map size, eligible living empires, configured difficulty/crisis multiplier where verified, and plausible military capability, with explicit floors/caps; no runaway positive feedback.
- Initial design targets: 2 functional fronts on small maps, 3 on medium, up to 4 on large; 10–25 years of active crisis content. Both are tuning targets, not engine facts. Reinforcement frequency requires a global cap per anchor and a hard aggregate fleet budget.
- Real system/planet changes must be reversible by player action where intended, with permanent scars only where documented. Defeat should permit retreat and rebuilding rather than forced immediate loss.
- Do not overwrite Vanilla crisis events, hooks, wars, or global crisis flags; preserve other mods. Gigastructures-specific ship balance/effects belong in a separately packaged optional compatibility submod; Core contains no hard references.
- Before first gameplay acceptance: prove exact 4.5.3 midgame timing, a single global coordinator, valid crisis country/diplomacy, mobile fleet orders, active stations, real planetary feature application, target ownership, and reliable victory attribution. The Codex technical tasks in the implementation plan are mandatory.

## 11. Boundaries of Stage III

Stage III may unlock preliminary research, defenses, and retained network evidence. It does **not** implement the Universal Ascension Protocol, reveal the Architects' purpose, automatically heal existing scars, or unlock Stage IV for a permanent personal opt-out. An empire's Stage-II continuation qualifies its personal advanced story; a galaxy-wide crisis win alone cannot grant that entitlement. Uninitiated empires may fight and contribute fully without being granted retroactive Stage-I/II rewards.

**Definition of Done:** the entire galaxy can experience and resolve a single real Nullwarden crisis whether zero, one or many empires completed Stage II; early warning works only for eligible and qualified empires in the relative 20-year window; unfamiliar empires suffer stronger authentic planetary consequences; objective completion is earned through real Stellaris gameplay; state and narration survive save/load, AI and MP. Full acceptance cases are in `stage-iii-acceptance.md`.

## 12. Integration and implementation gate

Follow ADR-002 I01–I07 for protected/active worlds, frozen cohorts and ownership transfers, pre-M-only first initialization, safe pending placement, authoritative state, separate enemy/finite budgets, and shared function validation. Public reach includes normal subjects and playable colonyless empires with appropriate valid effects; special-country interactions require their explicit matrix. No automatic first-install activation into a save already at/after M in v1. A supported initialized crisis resumes after M normally.

The [AP0–AP11 plan](stage-iii-implementation-plan.md) replaces the ZIP's preliminary six-package breakdown. The proof gate G1 precedes production content. All source findings, initial probe caps and preferred controller/anchor designs remain distinct from actual runtime acceptance; unsupported native behavior requires a reviewed contract update, never an old-stage patch.
