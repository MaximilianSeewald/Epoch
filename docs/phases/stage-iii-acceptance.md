# Stage III – Acceptance Matrix and Test Checkpoints

**Status: binding acceptance requirements; no Stage-III gameplay implementation or passing run exists yet.** Target Stellaris 4.5.3. Use exact mod SHA, build, galaxy settings, crisis multiplier, chosen Mid-Game Start Year, origin/empire class, seed, enabled mods, save checkpoints, fresh error/game logs and screenshots for UI. A passed unit test is **not** a passed native run.

[ADR-002 I01–I07](../architecture/adr-002-stage-iii-integration.md) resolves integration edge cases and is part of every test expectation. [AP0–AP11](stage-iii-implementation-plan.md) and the [engine contract](stage-iii-engine-contract.md) define gates. All T/E/F/R/N/X cases below are **planned, not executed for Stage III**.

## A. Temporal and lifecycle gates

- **T01**: Midgame configured **2300**. Stage-II-qualified country can prepare beginning around **2280**; no country can do so before its own completed/continued Stage II. Around 2300 the single crisis activates even if nobody prepared, subject to supported initialization and safe placement (I03/I04); no valid topology yields one diagnosed pending instance rather than unsafe spawn or victory.
- **T02**: Midgame configured **2250** (or another nondefault supported setting). Preparation shifts relatively to **2230**. Crisis shifts to ~2250. It is not hardcoded at 2280/2300. Verify a separate game with another changed setting.
- **T03**: Zero countries complete Stage II: outbreak still happens, all eligible ordinary countries, including normal subjects, are enrolled, including players and AI; no Stage-I/II story flags fabricated.
- **T04**: One qualified empire versus five: **exactly one** global hostile crisis, no duplicate anchor, wave or command ship. Country-local preparations remain independent.
- **T05**: Late Stage-II completion after P but before M: optional preparation available for remaining window only; no retrospective credits. Completion after M: no fictional pre-warning; generic response works. Reject legacy ready without final-choice-v1 proof, pending consent or suspended/unsupported personal state; do not patch old migration to grant eligibility.
- **T06**: Save/load just before P, M and the same-day activation; MP host/client join/reload. No double crisis, lost clock, MP OOS or repeated global reward.

## B. Empire eligibility and initial impact

- **E01**: Biological player and AI, Hive and Machine empires affected at M whether never participating, opted out, Stage-I-only or Stage-II veteran. No Stage-II precondition for outbreak.
- **E02**: Matched empire sizes and planets: Uninitiated suffers **strictly greater aggregate initial planetary damage** than Prepared. Both suffer nonzero real crisis exposure. No 'immune' machine/hive branch.
- **E03**: Uninitiated conflict-free eligible colony receives at least one real **existing EPOCH Contamination family** feature. If every colony is protected, already occupies that family or is an active Stage-I/II objective, I01 instead requires a supplementary real crisis modifier; record that exception, not a family overwrite. It is visible in the planetary UI and changes economy; does not create fake first-expedition outcomes or archaeology sites.
- **E04**: Previously `controlled`, `contained`, `studied`, or `healed` family states are not silently reverted; family exclusivity preserved and independent scar/structure families and active old objectives untouched. Existing permanent harm remains where intended.
- **E05**: 1-colony empire, multi-colony tall empire, no-colony but spacefaring, planet conquered/destroyed, newly founded colony, newly formed country and defeated country. No invalid scope, phantom owner, unbounded target retries or duplicate exposure.
- **E06**: Permanent personal opt-out: no revived private storyline, preparation or Stage-IV entitlement, **but** neutral crisis alert, physical planetary and fleet dangers still function.
- **E07**: Fallen/Awakened/marauder/enclave/guardian/crisis-country interaction matrix documents tested coverage and safe exclusions for personal UI while allowing consistent galactic military interaction.

## C. Fleet and strategic reality

- **F01**: Nullwarden fleet travels along real hyperlanes toward valid objectives, engages in genuine battle and changes plan after target loss; not a static aggro-only spawn.
- **F02**: Threat appears in accessible, defensible locations without instant unpreventable homeworld destruction; no isolated or forbidden systems.
- **F03**: Every anchor is a visible and interactable real object; disabling/destroying relay has a measurable impact on reinforcement flow and global state.
- **F04**: Reinforcements obey finite total budget, per-anchor cooldown/source limit and spawn cap. Destroyed relay ceases linked reinforcement; no exponential runaway.
- **F05**: Retreat/rebuild after initial defeat succeeds; neither losing nor elapsed time grants a victory flag. No false win from stale/dead event target.
- **F06**: Player final blow, AI ally final blow with validated contribution, foreign independent final blow and destroyed fleet during retreat: truthful global victory and country credit, one-time rewards only.
- **F07**: Overlap with Vanilla Khan/Tempest or a separate mod crisis and optional Gigastructures environment: no Vanilla override, no crashed or doubled state, bounded difficulty.

## D. Front mechanics and three resolution routes

- **R01**: Interdiction, scar/hazard and signal relay fronts have distinct effects on real systems or planets and valid targets. Small galaxy has safe reduced physical topology without skipping required functional objectives.
- **R02**: Stage-II preparation changes a real tactical condition, but does not instantly clear front or crisis. Untested countries have generic after-M defense path.
- **R03**: **Military victory:** all active anchor functions genuinely disabled and unique command formation genuinely beaten, then one global resolution.
- **R04**: **Scientific interruption:** valid military/strategic access to two distinct functions, real science at at least two physical locations and a final node operation disabling every remaining function; only then actual command-network deactivation/withdrawal. A button with energy payment alone never qualifies.
- **R05**: **Coalition containment:** at least two independent empires' proven physical contributions satisfy the same military/scientific function validator without gifting another empire a personal Stage-II history or reward.
- **R06**: Inaccessible/destroyed sites, missing scientists, fallen fleets, landlocked empires and lost owners have bounded owner-safe recovery, no automatic success.
- **R07**: After global end: no new waves, anchors retired once, existing planet scars remain, individual credits/losses are persistent, no global replay on save/load.

## E. Narrative, visuals, release evidence

- **N01**: Public crisis report makes no assumption of Phase-I/II participation. Veteran reports reflect only actual prior choices; opt-outs get generic news, not private re-entry.
- **N02**: EN/DE localization valid, present tense/current knowledge only, no Stage, Handoff, Mod, flag, event ID or UAP spoiler in player text.
- **N03**: Situations, special projects, decisions and modifiers show real effects/costs in native UI. No fake empty effect panels for numeric actions; no tooltip that triggers a second payout.
- **N04**: All registered objects visible with valid map markers, planets/features and native enemy graphics; no placeholder/sprite errors.
- **N05**: Fresh logs have no EPOCH-specific critical scope/depth errors, no duplicate instances, no uninitialized scripted effects; static regression, source-proofs and `git diff --check` pass.

## Minimal checkpoint sequence

1. **Post-Stage-II, M−21:** country A has continued Stage II, country B declined, country C never joined. Save.
2. **M−20:** A receives only personal preparation, B/C do not. Different M world verifies shift.
3. **M−1:** A completes at least one real defensive project. B/C remain unaware but their old planets are untouched.
4. **M (safe topology available):** all three receive the public crisis, the **same** global fleet/anchor state. B/C suffer stronger authentic damage; A has measured preparation protection. Save/reload.
5. **Front I/II:** lose and win actual ship battles; inspect reinforcements, target travel and planetary state. Save.
6. **Anchor analysis:** split saves for military, scientific and coalition routes. Verify no false completion and different national outcomes.
7. **Final confrontation:** all requirements met, one global end; test reload and negative cases (missing object, no qualifying battle).
8. **Repeat targeted smoke tests:** Machine/Hive, 1-colony, AI-only, host/client MP, optional mod off/on, Vanilla concurrent midgame crisis.

The project does not need to ask the user to hand-test every small change. Codex should use internal scripted/engine probes to reach the connected-playable checkpoint and then request one cohesive acceptance session; unresolved edge scenarios remain accurately labeled, not silently marked complete.

## F. Integration, lifecycle and performance additions (X01–X14)

| ID | Zusätzlicher Test | Erwartung |
|---|---|---|
| X01 | gleicher Planet ist aktives Stage-I/II-Ziel und einzig verfügbare Kolonie bei M | III-Overlay statt widersprechendem Familienwechsel; Altcallback behält ursprüngliche Kosten, Ergebnisse und Fortschritte |
| X02 | verlorenes Anchor-Target bei weiterhin existierendem Anchor | Identität wiedergefunden; kein Ersatz und kein Erfolg |
| X03 | zwei Spieler vollenden dasselbe Sabotageziel am gleichen Tag | globale Funktion einmal stillgelegt; nationale Beiträge nur nach wirklicher Leistung; keine doppelte Belohnung |
| X04 | Relay-Tod unmittelbar vor geplantem Spawn / Sieg unmittelbar vor Welle | anstehender Callback prüft Quelle/Phase und erzeugt nichts |
| X05 | Split/Merge, MIA, Retreat, Kommandantschiff stirbt bei überlebender Eskorte | keine Budgetregeneration; Schiffsziel und Flottenziel sauber getrennt, keine Verwechslung von Rückzug und Tod |
| X06 | alle normalen Verstärkungsbudgets erschöpft | kein Autosieg, Finale weiterhin physisch möglich, kein Pflichtkill nicht existierender Gegner |
| X07 | neue KI-/Spielerreiche durch Abspaltung, Übernahme, Unterwerfung | öffentliche Aufnahme einmal, keine privaten Erbquests; kein erneuter Planetenschaden allein durch Ownerwechsel |
| X08 | alle Welten enthalten geschützte oder studierte Altzustände | keine Verschlechterung; messbarer III-Effekt über geeignete Alternative; I01/E03-Ausnahme dokumentiert |
| X09 | Spiel ohne Community, ohne passende Föderation, nur ein normales Reich | militärischer/wissenschaftlicher Weg lösbar, kein Koalitionszwang |
| X10 | Erstinstallation vor P, zwischen P/M, nach M; zukünftiges unbekanntes Schema | nur ausdrücklich unterstützte Politik; keine stillen rückwirkenden Rewards oder Migrationserfolge |
| X11 | dauerhaftes Save/Reload nach aktivem und nach beendeten Krieg, inkl. MP-Wiederbeitritt und Spieler→KI | Budgets, Auflösung und private Historien erhalten; keine doppelte Krise/Rewards; OOS separat geprüft |
| X12 | voll belegte Karte, getrennte Hyperlane-Komponenten, blockierte Forschungsroute | begrenzter Retry/saubere Diagnose; kein Hauptstadt-Notspawn, kein Erfolg aus Unzugänglichkeit |
| X13 | unvorbereitetes Ein-Kolonie-Reich mit Nullproduktion einer bestraften Ressource | passende reale Zusatzwirkung; wirtschaftlicher Nachweis statt bloßem Icon |
| X14 | Performance auf kleiner und großer Karte, frühe Phase versus maximal aktive Krise | keine täglichen Vollscans; begrenzte Registry, Replan-/Pfadprüfungszahl und Scriptkosten; vor Release einen anhand Baseline gemessenen Grenzwert vereinbaren |

Testabdeckung systematisch verteilen: mindestens ein verbundenes Spiel je Bio/Hive/Machine, zwei unterschiedliche M-Werte in unabhängigen Spielen, ein Nullteilnehmer-Spiel und ein MP-Spiel mit Host/Client. Spezielle Fälle über reproduzierbare Saves und kleine Probes ergänzen; nicht behaupten, ein einzelner Hauptpfad decke das kartesische Produkt aller Eigenschaften ab. Alle drei Abschlussformen aus gemeinsamen Vor-Finale-Checkpoints testen. Bei fehlender tatsächlicher Gigas-Version bleibt diese Kombination unbestätigt und wird nicht als allgemeine Core-MP-Garantie verkauft.

## G. Release evidence rule

All 32 T/E/F/R/N groups plus X01–X14 require recorded results across a suitable run/checkpoint matrix, not a claim that one playthrough covers all combinations. Two configured M values, Bio/Hive/Machine, AI-only/zero prior participants, simultaneous independent countries, host/client MP, all completion forms, protected/active single-colony worlds and Vanilla overlap are mandatory. Source-only/static success is not runtime acceptance. Optional Gigas results require the exact tested version; absence does not certify the combination. Performance thresholds are set from measured AP9 baseline before release. First-install-at/after-M cases validate fail-closed v1 behavior; initialized III saves validate normal resume.
