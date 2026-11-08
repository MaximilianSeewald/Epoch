# Stage III – Installed Engine Evidence Register

**Status: source observations and existing static baseline only; no Stage-III runtime test executed.** Reviewed 2026-11-08 against main `6db578dcbf0165983b29f9ab752db2aeb97aafc1`, Stellaris 4.5.3 (4e91), Steam build 26325427. Existing generated documentation was read, not regenerated. File hashes are in the [manifest](../research/stage-iii-source-manifest-2026-11-08.json). The [engine contract](stage-iii-engine-contract.md) defines still-required proofs; [ADR-002](../architecture/adr-002-stage-iii-integration.md) states planning policies.

Labels: **Q** = inspected source/documented interface; **S** = executed static check; **V** = design proposal; **R** = required actual engine result still absent. Q or S never certifies AI mobility, object lifetime, save persistence or MP. In particular, source-supported negative timing is no longer wholly unknown, but exact -20/0 boundaries remain R.

## Source observations

Pfade relativ zu `G:/Steam/steamapps/common/Stellaris`; `DOK` bezeichnet den oben genannten Script-Dokumentationsordner. Hashes stehen im separaten Quellenmanifest.

| ID | Q – genaue Fundstelle | Was tatsächlich belegt ist | R – verbleibende Prüfung |
|---|---|---|---|
| Q01 | `launcher-settings.json:3`; Steam-Manifest `buildid` | Version 4.5.3 (4e91), Build 26325427 | spätere Updates erneut fingerprinten |
| Q02 | `DOK/triggers.log:1820` | `mid_game_years_passed`, unterstützt alle Scopes | exakte Tages-/Jahresgrenze bei -20 und 0 |
| Q03 | `events/marauder_events.txt:6675`, Vergleich :6682; `events/synthetic_dawn_events.txt:320`, Vergleich :326 | Vanilla verwendet `>= -10` in globalen, ausgelösten Events; negativer Vor-M-Vergleich ist kein bloßes Wiki-Gerücht | Übertragung auf -20, Ladefälle und konkrete Pulszustellung |
| Q04 | `DOK/triggers.log:1271`; `DOK/effects.log:1874`; `common/script_values/00_script_values.txt:1832`; `common/script_values/02_script_values_astral_planes.txt:67` | Midgame-Setting ist prüf-/auslesbar; Vanilla rechnet mit ihm | Einheiten und Ablagekontext vor eigener Rechnung loggen; keine Annahme „Wert ist 2300“ |
| Q05 | `common/on_actions/00_on_actions.txt:85`, :227, :310, :660 | globale Monats-, Jahres- und Midgame-Hooks; separater reichslokaler Midgame-Hook | Merge/Additivität und exakte Auslieferung in EPOCH/MP |
| Q06 | dieselbe Datei :80 | SP-Ladehook läuft laut Vanilla-Kommentar wegen OOS-Bedenken nicht beim Laden von MP-Saves | Recovery muss über reguläre Simulation funktionieren |
| Q07 | `DOK/effects.log:586`, :715; `events/grand_archive_events.txt:1536` | globale Flags und referenzierbare Targets; Voidworm-Start mit globalem Startschutz | Crash-/Load-/Mehrfachdispatch-Sicherheit unseres mehrstufigen Starts |
| Q08 | `common/country_types/00_country_types.txt:600`, :2464 | Khan: Horde-KI, `mid_game_crisis=yes`, hostile; Gray Goo: Berserk-KI, hostile, kein Border Access nötig | Modulbindung an EPOCH-Typ, Zielwahl, Krise-UI und Nebenwirkungen |
| Q09 | `events/marauder_events.txt:4539` bis :4589 | echte Raider-Flotte, Zielplanet-Suche, `auto_move_to_planet`, Bombardement und Faction-Hostility | Reise über mehrere Systeme, Blockaden, Umplanung und EPOCH-Hostility |
| Q10 | `events/an4_events.txt:156`, :395; `DOK/effects.log:758` | Fleet-`queue_actions` mit `move_to` zu Zielsystemen; Script-Orders sind vorhanden | Pfadverfolgung, Save-Persistenz, Unterbrechung durch Kampf und Rückzug |
| Q11 | `events/gray_goo_events.txt:58`, :329, :397, :461 | Fabrik als reales Schiff/Flottenobjekt; Verstärkung prüft Fabrik; Zerstörung kann globales Ende und Cleanup auslösen | eigener Anchor-Lebenszyklus, endliche Budgets und mehrere Funktionen |
| Q12 | `common/on_actions/00_on_actions.txt:1390`, :1504, :1566 | Ship-, Starbase- und Fleet-Destruction haben unterschiedliche Scopes | Objektreferenz nach Tod und Reihenfolge mit Exit-/Join-Hooks |
| Q13 | `events/crisis_events_1.txt:1320`, :3971; Country-Type `swarm`:1433 | echte Armee-Transporter und spezieller Invasions-KI-Kontext existieren | Transporter allein beweisen keine EPOCH-Landung, Besetzung oder Rückeroberung |
| Q14 | `events/grand_archive_events.txt:1536` bis :1567 | globale Voidworm-Aktivierung, Typwechsel und explizite Neutralität zu Enklaven | solche Ausnahmen nicht unbesehen übernehmen; ZIP verlangt konsistente militärische Interaktion |
| Q15 | `DOK/triggers.log:357`, :1572 | systemseitiger Zugangstest und flottenseitiger Pfadtest; letzterer ausdrücklich teuer | Zugriff ist noch kein Beweis einer von Spielern nutzbaren Route oder tatsächlicher Ankunft |
| Q16 | EPOCH `common/scripted_effects/epoch_core_effects.txt:26`, :37, :156, :194; `epoch_resonance_effects.txt:135` | Familien-Setter löschen vorherige Deposits; Migration baut anhand alter Flags neu auf | III-Exposition darf alte Geschichten nicht umschreiben oder von Recovery weggeräumt werden |
| Q17 | EPOCH `events/epoch_resonance_events.txt:529`, :537, :544 | Abschluss und ausdrückliches Continue sind bereits getrennt, `ready` erst in Continue | Stage III liest dies; kein Patch an Stage II erforderlich |

Bei Q11 ist besonders wichtig: Vanilla ist ein funktionales Beispiel, keine Blaupause für unsere Fairness. Seine wiederholten Verstärkungen und großflächige Gegnerbereinigung dürfen nicht die geforderten endlichen EPOCH-Budgets oder objektgenaue Cleanup-Regeln ersetzen. Q08s `mid_game_crisis=yes` ist eine Typkennzeichnung, kein Beweis einer automatisch korrekt terminierten neuen Krise.


## Executed static baseline

The unchanged baseline suite passed: 707 main assertions; 5,287 Stage-I modeled-state checks; 1,135 Resonance contracts/interpreted assertions; 33 installed-source/documentation checks; 1,873 narrative/UI/baseline assertions; 28-file structure validation and log-classifier self-test. Parser checks recur inside subtests and must not be summed as independent runtime cases. Current maximum scripted-effect depth reported: 3. See the [original static transcript](../research/stage-iii-baseline-static-checks-2026-11-08.txt). Historical error/game logs were excluded as evidence of a new run.

## Required future probe record

| Assertion | Source | Fixture / expected observation | Actual output or log | Remaining uncertainty |
|---|---|---|---|---|
| Relative P/M clock and additive hooks | Q02–Q06 | AP1: M=2250/2300, before/at/after P/M, SP/MP load | **Not executed** | Exact boundary, delivery, load/merge semantics |
| Single authoritative lifecycle | Q05–Q07 | AP2: 0/1/5 eligible countries, duplicate dispatch, carrier/country loss, MP | **Not executed** | Persistence, dispatch ordering, safe recovery |
| Native strategic travel/attack/retreat | Q08–Q10/Q15 | AP3: multiple hyperlanes, blocked/lost target, real starbase battle and retreat | **Not executed** | Custom country/module compatibility, replanning and fleet-order persistence |
| Physical anchor/source shutdown | Q11/Q12 | AP3: identify real station, kill/disable, delayed reinforcement must stop | **Not executed** | Identity lifetime, callback ordering, generation recovery |
| Genuine protected-world economic exposure | Q16 plus generated Planet/Colony docs | AP4: matched Bio/Hive/Machine, one-colony, active old quest, transfer and old callback | **Not executed** | Flag/migration isolation, displayed and actual economy |
| Global victory vs national credit | Q12/Q17 | AP3/AP7/AP8: direct/allied/foreign kill, retreat, cleanup and simultaneous sabotage | **Not executed** | Participation proof and death/exit order; no fictional attribution |
| Optional ground occupation | Q13 | Separate extension: escort, landing, conquest/reconquest, save and MP | **Not executed; outside v1 baseline** | Transport creation alone is insufficient |

No fixture code is included in this documentation PR. Once explicitly authorized, append exact commands, mod SHA, saves/settings, logs and observed outcomes to this table; never replace Not executed with a source excerpt. A failed proof stops its gate or requires a reviewed contract change.

## Required country-interaction matrix

Every row is a planned native validation target, **not executed**. Ordinary country detection must be derived from installed definitions; no speculative catch-all filter.

| Country category | Required public/planet behavior | Required military/personal boundary |
|---|---|---|
| Normal biological/Hive/Machine, human/AI, genocidal variants | Universal enrollment with class-valid nonzero additional effect | Native hostile interaction; private prep only with explicit own eligibility |
| Normal subject/vassal/protectorate | Same coverage; sovereignty is not a filter | Valid existing diplomacy, no coalition/Community requirement |
| Playable mobile/colonyless empire | Valid public fleet/system/economic alternative | No assumed capital/colony; no fabricated personal history |
| Fallen/Awakened | Explicit tested colony/feature treatment, no normal quests by default | No blanket new combat immunity; prove interaction or scoped native restriction |
| Marauder/enclave/guardian | No automatic normal-colony/quest assumptions | Document hostility and native restrictions; do not copy Voidworm enclave neutrality without review |
| Other crisis entities | No old-story rewards or ordinary initial population strike by assumption | Consistent tested shared-space interaction, no foreign crisis override |
| Pre-FTL | Not a normal spacefaring country for public intake | No invented normal-country quest/colony application |
| Observer | Suitable public observation without economic grants | No participant/reward status |
| Stage-III enemy | Excluded from public participant/exposure intake | Separate registry, budgets and operations |
