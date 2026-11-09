# Stage III – Priorisierter Implementierungsplan (AP0–AP11)

> **Current contract, second playtest (2026-11-09):** The user tested `2c95edf` and authorized the connected fixes in [second-playtest implementation](stage-iii-second-playtest.md). Required victory: every registered anchor and the unique command ship destroyed in combat; surviving minor formations withdraw afterward and never gate victory. Five globally synchronized chapters remain. Science/diplomacy cannot replace military objectives. Earlier residual-fleet hunt and opening-only approval gates are superseded. New changes have static regression evidence; new native display, retreat and MP results remain unverified.


**Fortschreibung 2026-11-08:** Der Folgeauftrag gibt den zusammenhängenden Auftakt bis zur Abwehr der ersten Offensive und statische Prüfung vor Spielerabnahme frei. Dieser Ausschnitt ist implementiert; die frühere Freigabegrenze und die Reihenfolge „Laufzeitprobe vor Implementierung“ gelten für diesen Auftrag nicht mehr. AP1–AP4/G1 sind weiterhin **nicht zur Laufzeit abgenommen**. Umfang und offene Nachweise: [Auftakt](stage-iii-opening-implementation.md). Der folgende Vollausbauplan bleibt für spätere Kapitel bestehen.

Alle folgenden Implementierungs-/Probe-Arbeiten sind **zukünftig und bis zur Freigabe nicht begonnen**. Auch ein temporärer Testmod ist Implementierung und fällt unter die Freigabegrenze. P0 blockiert Produktionsentwicklung, P1 gehört zur spielbaren Kernversion, P2 zur Veröffentlichung/optionalen Erweiterung.

| Paket | Prio / Abhängigkeit | Konkretes Ergebnis | Tests und Definition of Done |
|---|---|---|---|
| AP0 – Integrationsvertrag | P0; Freigabe | ADR-002 I01–I07 protokollieren und technische Umsetzbarkeit validieren; eingefrorener main-/Build-Fingerprint; unterstützte Saves/DLCs, Reichsmatrix, Parameterblatt und unveränderliche Altdateien festhalten | jede fachliche Anforderung einer Zustands-/Testregel zugeordnet; keine widersprüchliche Ein-Kolonie-/Schutzregel; Dokumentation klar als Design gekennzeichnet |
| AP1 – Uhr und Hook-Nachweis | P0; AP0 | isolierter, nicht ausgelieferter Engine-Probe; globale/örtliche Hook-Zähler, M−20-/M-Grenzen, Setting-Werte protokollieren | T01/T02/T05/T06: M=2250 und 2300; M−21, M−20, M−1, M, M+1; Vor-/Nachladefälle. Kein früher Trigger, relatives Fenster, Ausbruch ohne II. Additive Vanilla-Hooks bleiben aktiv |
| AP2 – Singleton und Schema | P0; AP1 | idempotenter stufenweiser Start, Tombstone, persistente Registry, Selbsttyp-Ausschluss und Recovery-Modell | T03/T04/T06, E05: 0/1/5 berechtigte Reiche, doppelte Dispatches am gleichen Tag, Verlust des ersten Reiches und MP-Reload. Genau ein kanonischer Gegner, kein Doppelobjekt/-reward; Recovery gewährt keinen Sieg |
| AP3 – Flotten-/Anker-Engine-Probe | P0; AP0, Testaufbau AP2 | eine echte mobile Flotte, ein bewaffneter Anker, eine Verstärkungsquelle; Orders versus KI-Modul vergleichen; Bodeninvasion separat bewerten | F01/F03/F05/F06: mindestens mehrere Hyperlanes, Sternenbasisangriff, Zielverlust, Rückzug, Relay-Tod, Angriff eines KI-Reichs. Quelle muss nach Disable stoppen. Enginenachweis entscheidet Steuerungsmodell und territoriale Reichweite |
| AP4 – Planeten-Integrationsprobe | P0; AP0 | nebenwirkungsfreie III-Operationen mit bestehenden Familien und Overlay-Fallback; Carrier-/Owner-/Migrationsvertrag | E02–E06: Bio/Hive/Machine, nur eine Welt, geschützte Welt, aktive II-Mission, Eroberung und spätere Altcallbacks. Kein Altfortschritt/Reward verändert; echte Zusatzbelastung und strikter Kohortenvergleich belegt |
| G1 – technisches Go/No-Go | P0; AP1–AP4 | Evidence-Tabelle mit Quelle → Probe → tatsächlichem Log → Restunsicherheit | Uhr, autoritative Einmaligkeit, mobile Feindschaft, physischer Anker und sichere Planetenwirkung erfolgreich. Scheitern führt zu begründeter Alternativentscheidung, nicht Contentausbau |
| AP5 – Vorbereitung und universeller Ausbruch | P1; G1 | private bezahlte Vorbereitung, globaler Start, Aufnahme aller normalen Reiche, öffentliche Berichte und generische Gegenmaßnahmen | T01–T06/E01–E06, N01/N03. Ein kohärenter Ausschnitt vom Vorfenster bis erstem echten Kampf; auch ohne Stage-I/II-Teilnehmer vollständig startbar |
| AP6 – Fronten und Budgets | P1; AP5 | 2–4 physische Fronten mit drei Funktionen, Hunter/Enforcer, finite Verstärkung, Replan und Wiederaufbau | F01–F05, R01/R02/R06. Limits und Budgetinvarianten inklusive verspäteter Events, Quellenverlust, Split/Merge und Erschöpfung halten; alle Funktionen erreichbar und sichtbar |
| AP7 – Forschung und Kooperation | P1; AP6 | ortsgebundene wissenschaftliche Route; Owner-/Schiff-/Zielnachweis; konservatives Beitragsregister; KI-Aufgaben | R04/R05/R06, F06, E06. Zwei Reiche bearbeiten getrennte/gleiche Ziele ohne doppelte globale Wirkung oder fremde Credits; Verluste/Kündigung niemals Erfolg |
| AP8 – Kommandant, Finale, Cleanup | P1; AP6/AP7 | einzigartiger Kommandant, gemeinsamer Siegvalidator, zwei physische Verfahren/Koalitionsmodus, einmaliger Abschluss | R03–R07/F04–F06. Endziel auch nach Budgeterschöpfung verfügbar; kein Sieg durch Zeit/Referenzverlust; keine nachlaufenden Spawns; Altfolgen/Opt-out unverändert |
| AP9 – Texte, UI und Balancing | P1; stabile Zustände AP5–AP8 | vollständige DE/EN-Inhalte, drei Stimmen, reale Tooltips/Marker; Zahlen und Fairness austarieren | N01–N04/E02/F02/F07. Keine erfundene Erinnerung/Spoiler; keine unaufhaltbare Hauptstadtvernichtung; Wirtschaftsvergleich und 10–25-Jahre-Ziel messen, nicht garantieren |
| AP10 – Release-Abnahme | P1; AP5–AP9 | versioniertes Evidenzpaket und vollständige zusammenhängende Fünf-Kapitel-Abnahme | alle 32 ZIP-Kriterien plus Zusatztests unten im echten 4.5.3-Kontext; frische Logs, SP/MP, KI, Vanilla-Overlap und unveränderte Stage-I/II-Regressionsbasis |
| AP11 – optionale Gigas-Kompatibilität | P2; stabile Core-Abnahme, genaue Fremdmod-Version | separat installierbares Paket, nur validierte Fremdmod-IDs/Skalierung | Core ohne Gigas und ohne Kompatibilitätspaket funktionstüchtig; Loadorder/Metadaten und aktivierte Kombination separat getestet. Kein hartes Core-Dependency |

Kritischer Pfad: **Freigabe → AP0 → AP1/AP2 → AP3/AP4 → G1 → AP5 → AP6 → AP7/AP8 → AP9 → AP10.** Die Abhängigkeiten erlauben getrennte Nachweisschritte; es ist keine pauschale Aufforderung zur Agentendelegation.

Empfohlene spätere Änderungsschnitte: ein zusammenhängendes Engine-/Schema-Fundament, dann ein durchspielbarer Ausbruch mit echter Front, anschließend übrige Fronten und Auflösungen, zuletzt Abnahme. Dieses Planungsdokument autorisiert keine Gameplay-Commits; der separate Dokumentationsauftrag umfasst den Docs-Commit/PR, aber keinen Merge. Zeit-/Aufwandsschätzungen vor AP3/AP4 wären wegen nativer KI und Planetenkonflikten unzuverlässig; nach G1 anhand des erprobten Steuerungsmodells neu schätzen.


## Normative integration and evidence

The [specification](stage-iii-military-crisis.md), [ADR-002 I01–I07](../architecture/adr-002-stage-iii-integration.md), [engine contract](stage-iii-engine-contract.md) and [evidence register](stage-iii-engine-evidence.md) govern all packages. AP0 records the resolved planning policies rather than silently choosing conflicting alternatives from the historical analysis. [Acceptance](stage-iii-acceptance.md) contains T/E/F/R/N plus X01–X14. Source-supported timing is not a runtime pass. No gameplay or executable probe is authorized by this documentation PR.

## Operational constraints and repository layout

Start future gameplay work on a separately authorized branch from the then-current main. Keep changes cohesive; prove the engine in disposable fixtures before production. No Stage-I/II mechanism changes, no Vanilla override, no DLC/Gigas hard dependency, origin, civic or free start bonus. Do not issue a full player-acceptance request until all five chapters form a coherent playable crisis. Early internal probes are required after authorization.

| Area | Planned ownership |
|---|---|
| `common/on_actions/epoch_stage_iii_on_actions.txt` | New additive global/owner-local dispatch; merge behavior must be proven |
| `events/epoch_stage_iii_*.txt` | Lifecycle, public reports, private preparation, functions and resolution |
| `common/country_types/`, `common/global_ship_designs/` | Separate III crisis country and actual engine-validated designs; preserve Stage-II country |
| `common/scripted_effects/`, `common/scripted_triggers/` | New flat scope-safe III operations; no old infection/mission-setter shortcuts |
| `common/special_projects/`, `common/situations/`, `common/decisions/` | Paid preparation, research/containment and accurate native UI |
| `common/static_modifiers/` | Genuine supplementary III hazards, including protected-world fallback |
| Existing `common/deposits/` definitions | Reuse existing three families without modifying Stage-I/II definitions; a required old-definition change is a separate scope gate |
| `localisation/english/`, `localisation/german/` | Separate III player-facing keys; preserve old localization/mechanics |
| `scripts/test_stage_iii*.cjs` | Future source/definition/model checks, never labeled engine runtime |

Folder names are based on the current repository; the ZIP's illustrative `common/ship_designs` and `common/planet_modifiers` are not the implementation layout. Only add needed, source-validated files. Parameter caps in ADR-002 I06 are probe values; AP9 must define production units, floors/caps, timing and performance thresholds before release.

## Gesamte Definition of Done

Stage III gilt erst als fertig, wenn sämtliche folgenden Aussagen durch passende statische und reale Nachweise getragen sind:

1. Eine einzige Krise startet in unterstützten Saves relativ zum eingestellten M und unter den sicheren Platzierungsregeln von ADR-002 I03/I04 bei 0/1/vielen früheren Teilnehmern, Vorbereitung ausschließlich nach nachgewiesener privater Berechtigung und nur im Fenster M−20 bis M.
2. Alle normalen Raumfahrtreiche einschließlich Subjekte, KI, Nichtteilnehmer und persönlicher Opt-outs werden passend aufgenommen; Sondertypen und kolonielose Reiche sind ausdrücklich geregelt.
3. Echte mobile Gegner kämpfen und planen um; alle drei Ankerfunktionen hängen an sichtbaren, physisch bearbeitbaren Objekten; Verstärkung ist quellenabhängig und endlich.
4. Planetare Zusatzbelastung ist wirklich wirksam und für vergleichbare Uninitiierte stärker; geschützte/abgeschlossene Altzustände und aktive Stage-I/II-Aufgaben werden nicht umgeschrieben.
5. Militärische, wissenschaftliche und kooperative Abschlüsse verlangen tatsächliche Ziele. Kein Fortschritt aus Zeitablauf, Targetverlust, bloßem Bezahlen oder Cleanup-Tod.
6. Verlieren, Rückzug und Wiederaufbau bleiben möglich; Budgets und Recovery erzeugen weder Endlosschleifen noch einen unlösbaren Restzustand.
7. Save/Reload, KI und Host/Client-MP bestehen die definierte Matrix. Bestehende Stage-I/II-Dateien und ihre gültigen Ergebnisse bleiben unangetastet; keine neuen kritischen EPOCH-Scope-/Initialisierungsfehler oder OOS-Befunde.
8. Native Vanilla-Krisen und Core ohne Gigas bleiben funktionstüchtig; optionale Kompatibilität ist gesondert ausgewiesen.
9. DE/EN-Text und UI entsprechen realen Zuständen, unterscheiden öffentliches und persönliches Wissen und verraten die Stage-IV-Auflösung nicht.
10. Ein versioniertes Abnahmepaket enthält Ergebnisse statt nur Kriterien, und offene Einschränkungen werden ausdrücklich benannt. Kein pauschales „MP-kompatibel“ auf Basis eines statischen Tests.
