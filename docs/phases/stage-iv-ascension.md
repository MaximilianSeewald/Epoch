# Stage IV – Ascension: Das Vermächtnis der Architekten

> **Status: approved design; Packages A/B implemented for connected acceptance, static-only evidence.** Target: Stellaris Cygnus 4.5.3. See [Package A](stage-iv-package-a.md) and [Package B implementation, exact technology IDs and source balance](stage-iv-package-b.md). Packages C/D remain planned. This document supersedes the earlier direction-only Stage-IV outline. It does not assert native-engine compatibility or claim the player has tested Stage IV. Technical unknowns are tracked in [stage-iv-technical-feasibility.md](stage-iv-technical-feasibility.md), and deliverables in [stage-iv-work-packages.md](stage-iv-work-packages.md).

## 1. Vision and boundaries

Stage IV closes the personal EPOCH story after the universal Nullwarden crisis and begins a durable high-technology era. The player earns access through an archaeology-and-science investigation, deliberate healing of past damage and **real military destruction of a personal Leviathan**. Afterwards, 42 native research technologies gradually unlock superior buildings, weapons and ship components, unique traditions, ascension perks, species traits and megastructures. Events tell a connected mystery; game objects, projects, decisions, technologies, traditions, perks, buildings and fleets deliver the gameplay.

Stage I and II remain local to each empire; Stage III was one universal galactic crisis. Stage IV is **personal again**. Never grant the private ascension merely for fighting or winning Stage III. Preserve all permanent personal opt-outs and previous choices. No new starting origin/civic; no wholesale Vanilla overrides; DE/EN localization; no lore spoilers in option tooltips. EPOCH remains **one standalone mod** with no required Gigastructures dependency or separate test mod.

## 2. Eligibility, start and personal authority

A country is eligible only when:
1. It genuinely completed and explicitly continued the local Stage-I story.
2. It completed Stage II and explicitly chose its final continuation; no permanent refusal or invalid legacy path applies.
3. The shared Stage-III Nullwarden crisis has been militarily repulsed.
4. It is a valid ordinary empire type with applicable biological, Hive or Machine pathway (including suitable individual Machines).

Post-crisis entry is staggered across 1,800–3,600 Stellaris days (5–10 years), with possible qualifying discovery triggers after a minimum delay. Never schedule duplicates. Successful Stage-III participation or the final blow is **not** required; a player that never qualified privately cannot gain entry through the shared war. In MP/AI, store eligibility, chapter, flags, event targets, rewards and Leviathan identity **by owner**, never as one global Stage-IV object. Loss of an original world, site, science ship or scientist must have a bounded, paid recovery route.

The local main situation has six meaningful milestones; elapsed time may start or pace a chapter but **never completes an action**. Only real callbacks, treatment, physical construction and an authenticated combat kill advance required goals. The final narrative milestone and research unlock are exactly-once, including load/re-entry/late-joining AI.

## 3. The narrative: six chapters

| Chapter | Story discovery, deliberately spoiler-gated | Required native gameplay | Outcome |
|---|---|---|---|
| I. Das Schweigen nach dem Sturm | Surviving records change under observation; organic/Hive/Machine interpretations differ | Two staffed science-ship projects in distinct suitable systems; choose careful/experimental/guardian analysis | Historical clues; initial six prototype-tech gates begin opening |
| II. Das Archiv ohne Schöpfer | A sealed site contains incompatible memories and a broken order | Four-stage archaeological site with valid fleet/site scopes, scientist and distinct stage callbacks; secure/extract/isolate choices | Archive findings, later Leviathan countermeasures |
| III. Die Umkehrung | Harm is an incomplete, potentially reversible resonance transformation | Diagnose, paid stabilization and **positive conversion of at least one eligible EPOCH feature** using planetary decisions/projects | Actual permanent positive state and reconstruction data |
| IV. Das gebrochene Protokoll | The Architects/UAP are revealed **here**, not earlier; original protection failed to distinguish consent from coercion | Construct and fund a small prototype; choose careful/experimental/guardian research posture | Validated personal authorization to summon the guardian |
| V. Der letzte Richter | A last guardian judges unauthorized protocol activation | Unique extremely challenging Leviathan, optional real countermeasure research, **native combat kill of identified command ship** | Permanent personal protocol key |
| VI. Die Erben der Architekten | Full revelation and two long-term philosophies: guard the protocol or free it | Exactly-once conclusion, research eligibility and path selection; no immediate bulk tech grants | 36 post-boss technologies, later traditions/perks/infrastructure become possible |

The Architects hypothesis is **Stage-IV writing canon to develop**, not a fact prematurely exposed in previous stages: an alliance of unlike intelligences attempted voluntary convergence; damaged UAP components could no longer distinguish voluntary connection from assimilation, while Nullwardens were autonomous safeguards acting on corrupted instructions. Stage IV retrospectively connects Contamination (incomplete adaptation), Scar (network spacetime disruption) and Silent Structure (isolated archives/controllers). Give the reveal through investigations, not a single exposition dump. Neither path is labeled moral or universally best.

## 4. Personal Leviathan: The Final Adjudicator

- Exactly **one personal challenge** per qualifying empire; a unique owner-keyed object and proof of death. Other countries may provide military aid, but neither accidental last-hit ownership nor another empire's guardian grants or denies the owner's key.
- Place in a **star-only, planet-free system**: a star is allowed; ordinary planets, colonized planets, habitable candidates, moons and unrelated strategic objects are excluded. Prefer a validated existing unoccupied star-only system; a custom initializer plus `spawn_system` is a conditional alternative only after source checking. The site must be navigable and reachable; never hijack an existing empire's valuable system or create overlapping challenge instances. Use one EPOCH mod only.
- The unique principal guardian and any supporting fleet have a true combat identity. No timers, scripted cleanup, missing objects, research or foreign guardian death substitute for destruction. A defeat is recoverable, including rebuilt fleets and reissued targeting orders.
- Three **design** combat beats: Verweigerung (strong shields, 100–70% hull), Urteil (new weapons and bounded reinforcements, 70–30%), Gebrochenes Protokoll (lower defenses/higher offense, 30–0%). Hull-threshold event support is not verified; adapt to a native dependable hook before coding.
- Initial *target* difficulty: roughly 3–4 times the combined perceived Stage-III commander encounter, **not** a promised fleet-power statistic. Tactical preparation matters; do not solve difficulty with only enormous hit points. Scale conservatively with year, settings and real engine combat evidence.
- Only the authorized owner earns its protocol key, once. An ownership change, removed site or destroyed guardian **without verified battle** must not fabricate completion. Other empires' paths proceed independently.

## 5. Planetary inversion and durable positive features

Stage-IV healing requires real diagnosis, paid treatment and positive conversion of one eligible world **before** the Leviathan. Other worlds remain optionally treatable afterwards. Do not replace an active Stage-I/II objective or reset older decisions; use per-family state predicates and exactly-one visible state per family, as existing EPOCH rules require. Handle historic cured, studied, contained, destroyed, occupied, lost and foreign-owned targets. A destroyed Silent Structure cannot simply respawn on the same world: a more expensive reconstruction on a different owned world is an alternative.

| Existing EPOCH family | Proposed earned terminal state | Initial tuning target (planet-local) |
|---|---|---|
| Resonance Contamination | Symbiotische Resonanzmatrix | +10% jobs output, +5 stability, appropriate habitability effect |
| Resonance Scar | Harmonisierte Raumfalte | +15% research jobs output, +5 stability |
| Silent Structure | Erwachtes Resonanzarchiv | +15% research jobs output, +10% unity jobs output |

Progress: diagnose actual damage → contain/stabilize at real cost/time → replace only the family's old deposit/feature with the earned terminal state. Never stack all prior family states, silently heal existing Stage-III damage, or let conquest re-award personal progress. The required story objective may be fulfilled through a comparable paid ship/station research recovery route where no usable owned world exists (e.g. colonyless or nomadic origins); this must **not** create a fabricated new physical healed planet.

## 6. Research: 42 native technologies, 14 in each department

*Numbers are planning IDs, not game script identifiers.* Six prototypes are accessible during the six-chapter story; the remaining 36 become **researchable**, not automatically researched, after a genuine personal Leviathan victory. Use standard Vanilla research menus, clear prerequisite DAGs, source-compatible categories/tier weights and class-appropriate eligibility; no artificial separate technology UI.

### Physics (14)
| ID | Technology | Tier | Unlocked gameplay |
|---|---|---|---|
| P01 | Nachhall-Spektroskopie | 0 | Science-ship signal analysis |
| P02 | Phasenfenster-Kalibrierung | 0 | Improved special investigations |
| P03 | Nullfrequenzsensorik | I | Advanced sensors and intel |
| P04 | Kausale Datenrekonstruktion | I | Research-building integration |
| P05 | Kohärenzfeldtheorie | I | Planetary field engineering |
| P06 | Resonanz-Energiespeicherung | I | Improved energy production |
| P07 | Nullfeld-Schirmung | II | Advanced ship shields |
| P08 | Phasenbrecher-Emitter | II | New medium/large energy weapon |
| P09 | Kausal-Lanze | II | New X-slot energy weapon |
| P10 | Nullwellen-Torpedos | II | Anti-capital torpedoes |
| P11 | Hyperraum-Kohärenz | II | Advanced hyperdrive |
| P12 | Transzendenter Schildverbund | III | Endgame fleet and structural shields |
| P13 | Protokollbrecher | III | Titanic/T-slot weapon |
| P14 | Universelle Feldkopplung | III | UAP interface prerequisite |

### Society (14)
| ID | Technology | Tier | Unlocked gameplay |
|---|---|---|---|
| S01 | Resonanzdiagnostik | 0 | Diagnosis of EPOCH planet states |
| S02 | Reversible Resonanzinversion | 0 | First paid positive conversion |
| S03 | Adaptive Sanierung | I | Cheaper subsequent treatment |
| S04 | Symbiotische Gewebekalibrierung | I | Organic planet development |
| S05 | Synaptische Transkription | I | Hive research systems |
| S06 | Die Ethik des Signals | I | Consent, reconstruction and identity research |
| S07 | Symbiotische Konvergenz | II | Organic species trait access |
| S08 | Autonome Schwarmknoten | II | Hive trait access |
| S09 | Synthetisches Selbstmodell | II | Machine species trait access |
| S10 | Planetare Harmonie | II | Enhanced positive planetary features |
| S11 | Identitätsanker | II | Stabilized class ascension |
| S12 | Souveräne Transzendenz | III | Class-specific high-grade benefits |
| S13 | Das Nullwächtermandat | III | Guardian final philosophy prerequisites |
| S14 | Universale Souveränität | III | Free-convergence final philosophy prerequisites |

### Engineering (14)
| ID | Technology | Tier | Unlocked gameplay |
|---|---|---|---|
| E01 | Nullwächter-Materialanalyse | 0 | Material analysis |
| E02 | Rekonstruktion der Wächter-Telemetrie | 0 | Personal Leviathan countermeasure research |
| E03 | Resonanzstahl-Verarbeitung | I | Advanced material processing |
| E04 | Protokollkern-Fertigung | I | New strategic resource production |
| E05 | Kohärenz-Labortechnik | I | Research complexes |
| E06 | Nullfeld-Kollektoren | I | Superior energy buildings |
| E07 | Fraktale Artillerietechnik | II | Heavy kinetic weapon and alloy process |
| E08 | Protokollreaktor | II | Advanced ship reactor |
| E09 | Selbstheilende Phasenpanzerung | II | Armor and limited regeneration |
| E10 | Autonome Schwarmjäger | II | New strike craft |
| E11 | Fraktale Punktverteidigung | III | Advanced point defense |
| E12 | Architekten-Fabrikation | III | Architects' Forge megastructure |
| E13 | Resonanz-Nexus-Architektur | III | Resonance Nexus megastructure |
| E14 | UAP-Kernkonstruktion | III | UAP Interface megastructure |

Planning tier counts are verified against the 42 listed rows: **6 prototypes / 12 Tier-I / 14 Tier-II / 10 Tier-III = 42**. Tier placement remains a balance/design proposal; changing it requires updating prerequisites and counts consistently. Indicative research costs: prototypes 6–12k, I 20–35k, II 45–70k, III 85–140k research points, always tuned against actual 4.5.3 research scaling, galaxy settings and timing.

Non-cyclic example prerequisites: P07 after P05 + E03; P09 after P08 + E08; class traits after appropriate S07/S08/S09 + S11; Nexus after E13 + P14; Interface after E14 + P14 + an earned final philosophy. Leviathan approval is mandatory for post-boss technology; tech/research does not bypass combat.

## 7. New economy, buildings and military hardware

**Single new strategic resource:** *Protokollkerne* (Protocol Cores), produced in capped factories and later large-scale Forge infrastructure. Used by advanced equipment, top-tier buildings, construction and ongoing upkeep. Avoid many new subresources and free post-boss production.

Eight building families, each with real upgraded levels, upkeep, build slots and role:

| Family | Planned levels | Purpose |
|---|---:|---|
| Kohärenz-Forschungskomplex | 3 | Advanced science and resonance-world synergy |
| Architekten-Schmelze | 3 | Superior alloy production |
| Nullfeld-Kollektor | 2 | High-yield energy |
| Harmonisierungsinstitut | 2 | Healing support and stability |
| Kausalitätsarchiv | 2 | Unity and science |
| Phasengenerator | 2 | Defensive planet systems |
| Protokollkern-Fabrik | 2 | New strategic resource |
| Wächterakademie | 2 | Naval and army coordination |

Planning power: approximately 20–40% above a comparable **late Vanilla** object at full rank where appropriate, counterbalanced by inputs, strategic upkeep, construction and capacity; not 20–40% empire-wide bonuses. Check the actual 4.5.3 cost, job, slot, range and weapon definitions before final numbers.

Weapons: Kausal-Lanze (X), Phasenbrecher (M/L), Fraktale Artillerie (L), Nullwellen-Torpedo, Autonome Schwarmjäger (H), Fraktale Punktverteidigung (P), Protokollbrecher (T). Components: Nullfeld-Schilde, selbstheilende Phasenpanzerung, Protokollreaktor, Kausalitäts-Zielcomputer, Kohärenz-Hyperraumantrieb and temporaler Stabilisator. All fit native compatible hulls and have specific combat roles. Do not invent a new ship-class dependency merely for visual scale.

## 8. Four traditions, five actual ascension perks

Each of four native trees has **adoption, five traditions and finisher**. All eligible empires may choose the universal tree; only **one** class tree is relevant (organic / biological Hive / Machine, including appropriate individual Machines).

| Tradition tree | Access | Five traditions, concept order | Capstone |
|---|---|---|---|
| Das Vermächtnis | All eligible after personal guardian kill | Fragmentierte Chroniken; Gesicherte Rekonstruktion; Kausale Disziplin; Operative Harmonisierung; Erbe der Nullwächter | Generic EPOCH engineering and access to class path |
| Symbiotische Transzendenz | Organic individuals | Perfekte Adaptation; Lebende Architektur; Regenerative Symbiose; Bewusste Evolution; Organische Souveränität | Living Ascension perk gate |
| Schwarmkonvergenz | Biological Hive | Neuronale Expansion; Resonante Drohnen; Autonome Knoten; Synchronisierte Anpassung; Ungeteiltes Bewusstsein | Hive perk gate |
| Souveränes Netzwerk | Machine empires | Selbstkorrigierende Systeme; Verteilte Intelligenz; Rekursive Architektur; Protokoll-Unabhängigkeit; Nullwächter-Souveränität | Machine perk gate |

Five new **native, selectable** perks:
1. **Lebende Ascension** – organic class tree + S07/S11; improved organic traits and special resonance planet development.
2. **Ein Bewusstsein, tausend Möglichkeiten** – Hive class tree + S08/S11; improved drones, nodes and combat coordination.
3. **Das souveräne Protokoll** – Machine class tree + S09/S11; machine traits and advanced autonomous Nullwarden subsystems.
4. **Erbe der Nullwächter** – universal tree + S13 + military technologies; accepts defensive guardian mandate, specialized ship parts and upkeep burden.
5. **Freie Konvergenz** – universal tree + S14 + advanced social/UAP technology; independent research/healing/economic integration.

Perks 4 and 5 are mutually exclusive. A single empire normally gets one class perk and at most one final philosophy perk; the total content count is five, **not** five freely stackable perks per empire. Respect existing Vanilla ascensions and trait exclusions; no forced species conversion.

**Slot tension is explicit:** normal Stellaris offers 7 tradition-tree slots and up to 8 ascension perks. Many empires may have no free slots by Stage IV. The narrative and all 42 basic technologies must remain accessible regardless of spare slots, but native trees/perks cannot be awarded when no slot exists. EPOCH Core must **not silently override** tradition UI/Vanilla defines. Work Package C must present a decision backed by installed 4.5.3 evidence: one-mod opt-in, additive and compatible slot support if genuinely safe, otherwise preserve native slot constraints and document the strategic planning trade-off. Do not pretend unavailable perks are guaranteed. See feasibility notes.

## 9. Traits and megastructures

Five new species traits: Resonante Physiologie and Symbiotische Intelligenz for organic species; Konvergente Drohnen for Hives; Nullwächter-Kern for Machines; Protokollgeprägt as final class-sensitive reward. Apply via real compatible species modification or the native appropriate mechanism. Never overwrite incompatible ascension, citizenship, species or trait systems.

Three physical multistage megastructures, with valid placement, construction, upkeep and actual intermediate effects:

| Structure | Stages | Effect and restriction |
|---|---:|---|
| Resonanz-Nexus | 3 | Research, planetary harmonization, small Protocol Core supply; max one functional Nexus per empire |
| Architekten-Schmiede | 3 | Alloys and industrial-grade Protocol Core manufacturing; significant inputs and build requirements |
| UAP-Interface | 4 | Single per empire; final philosophy determines defensive fleet role or science/healing role; very high upkeep |

No hard dependencies or references to Gigastructures; optional compatibility may be explored later **inside the same core-mod strategy** only if fully additive. Do not create a second mod as a prerequisite.

## 10. Implementation and acceptance principles

Four executable packages in [stage-iv-work-packages.md](stage-iv-work-packages.md): A personal narrative/leviathan, B tech/buildings/weapons, C traditions/perks/traits/megastructures, D integration/balance. Keep PRs narrowly scoped and review at **coherent playable milestones**, not for every tiny fix. Do not create a separate tech-probe mod or a large test harness. Small source checks against the installed Vanilla 4.5.3 files suffice to choose initial implementation patterns; runtime claims wait until meaningful gameplay exists. Save/load, AI, multiple simultaneous owners, event-target isolation and DE/EN remain release requirements; neither a static parser pass nor a single playthrough proves multiplayer.

## 11. Exact open decisions (not yet implementation facts)

1. Empty-system generator/initializer and pathing: source-check first; fallback to existing safe star-only system and owner-specific reservations.
2. Tradition/AP slot strategy with exactly one mod: avoid a silent GUI/define override; prove any safe extension or leave default slots unchanged.
3. Planet-feature/state transitions and recovery: preserve EPOCH's current three family invariants and separate Stage-IV positive states.
4. Native midpoint combat-phase mechanics, responsive Leviathan AI and species/guardian support across organic/Hive/Machine.
5. Actual per-object research and cost balance against installed 4.5.3 vanilla.

The major lore, counts, six chapter outline and four work packages are the **agreed design baseline**. Numeric values, tech tiers, scripts, visuals and feasibility-dependent behaviors remain implementation proposals until checked.
