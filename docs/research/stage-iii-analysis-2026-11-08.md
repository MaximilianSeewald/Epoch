# Archived pre-integration technical analysis

**Historical analysis, not the current normative specification.** Preserved in full from the original visualization artifact, SHA-256 recorded in the [source notes](stage-iii-source-notes.md). Its observations describe the pre-documentation main and its V/proposal sections record alternatives before integration. The [current implementation plan](../phases/stage-iii-implementation-plan.md), [specification](../phases/stage-iii-military-crisis.md), [integration policy](../architecture/adr-002-stage-iii-integration.md) and [engine evidence](../phases/stage-iii-engine-evidence.md) supersede its recommendations where refined. Historical statements that the repository was unchanged refer to the original analysis session. Implementation still requires a separate user authorization.

---

# EPOCH Stage III – Die Konvergenz der Nullwächter

Technische Analyse und priorisierter Umsetzungsplan · 8. November 2026

**Ergebnis:** Das Konzept ist anhand der untersuchten 4.5.3-Schnittstellen plausibel umsetzbar. Eine Freigabe für die vollständige Entwicklung sollte jedoch erst nach gezielten Engine-Nachweisen erfolgen. Das relative Timing hat inzwischen einen konkreten Vanilla-Beleg; die größten offenen Punkte sind strategische Flottensteuerung, Integration in die vorhandenen Planetenzustände und belastbare MP-/Save-Lebenszyklen.

**Arbeitsgrenze:** ausschließlich Analyse und Planung. Keine Gameplay-Datei, bestehende Dokumentation, Stage-I/II-Logik, Modaktivierung oder Save-Datei geändert. Kein Branch angelegt, kein Commit erstellt, Spiel nicht gestartet. Auch kein ausführbarer Stage-III-Prototyp erstellt. Die im ZIP enthaltenen Aufforderungen zum Anwenden, Verzweigen und Implementieren wurden als Dokumentinhalt behandelt und nicht ausgeführt. Erstellt wurden nur dieser Bericht, ein Quellenmanifest und das Protokoll bestehender statischer Prüfungen außerhalb des Repositorys.

## 1. Bezug, Version und Aussagekraft

| Gegenstand | Festgestellter Stand |
|---|---|
| Repository | `MaximilianSeewald/Epoch`, lokaler Checkout `C:/Users/Maxim/Documents/GitHub/Epoch` |
| Aktueller GitHub-main | über GitHub-Connector abgefragt: `6db578dcbf0165983b29f9ab752db2aeb97aafc1` |
| Lokaler main / ZIP-Basis | derselbe Commit; die fünf im ZIP hinterlegten Git-Blob-Baselines stimmen vollständig überein |
| Arbeitsbaum | getrackte Dokumente und Gameplay stimmen mit main überein; bereits bei Beginn ungetrackt: `.codegraph/` |
| ZIP | 17 Einträge, 47.769 Byte; SHA-256 `780fe16c65d97f6b16f4bae69b2942598bc825b120e85e3cb37ccf61d321da0d` |
| Spielinstallation | `G:/Steam/steamapps/common/Stellaris` |
| Versionsnachweis | `launcher-settings.json`: `Cygnus v4.5.3 (4e91)`; Steam `appmanifest_281990.acf`: Build `26325427` |
| Generierte Script-Dokumentation | vorhandene Dateien unter `Documents/Paradox Interactive/Stellaris/logs/script_documentation`, Zeitstempel 08.11.2026 15:24:50; in dieser Analyse nicht neu erzeugt |

Git-HTTP war in der Shell nicht erreichbar; die Kontrolle des aktuellen Remote-main erfolgte erfolgreich über den GitHub-Connector. Referenz: [geprüfter main-Commit](https://github.com/MaximilianSeewald/Epoch/commit/6db578dcbf0165983b29f9ab752db2aeb97aafc1).

Bezeichnungen in diesem Bericht:

- **Q – Quellenbeleg:** konkrete Definition oder dokumentierte Schnittstelle in der lokalen Installation beziehungsweise im aktuellen EPOCH-Code. Belegt Existenz und deklarierten Kontext, nicht automatisch korrektes Stage-III-Verhalten.
- **S – statisch geprüft:** vorhandene Parser-, Modell- und Vertragsprüfungen ausgeführt. Kein Stellaris-Runtime-Nachweis.
- **V – Vorschlag:** begründete Architektur- oder Spielregelentscheidung für die gemeinsame Bewertung.
- **R – Runtime offen:** erst durch einen nach Freigabe gebauten Test und echte Spielausführung zu entscheiden.

Es gibt aus dieser Arbeit **keinen Stage-III-Runtime-Pass**. Vorhandene Spielberichte zu Stage II gelten nur für ihren jeweiligen Commit und die berichtete Route. Das ZIP berichtet einen erfolgreichen Hauptpfad auf `84aaa4cf72cdc32f6aee6c371178f5fcb8e3693e`; daraus folgt keine vollständige KI-, Alternativpfad- oder MP-Abnahme.

## 2. Vollständiger Dokumentabgleich

Alle 17 ZIP-Einträge wurden inhaltlich geprüft. Das Paket ist eine Dokumentationsüberlagerung des unverändert vorhandenen Basiscommits, keine spielbare Stage III. Die fachliche Grundlage wird für diesen Plan übernommen; Statusetiketten wie „ACCEPTED“ ersetzen keine technische Validierung oder Implementierungsfreigabe.

| ZIP-Datei | Abgleich mit main und Folgerung |
|---|---|
| `README.md` | Ersatz für bestehende Übersicht. Neue universelle Krise und Vorbereitungsfenster; Status von Stage II wird als berichteter Hauptpfad-Erfolg präzisiert. |
| `STAGE3_README.md` | Neu; erklärt Paket, Prioritäten und Anwendungsweg. Enthält Ausführungsanweisungen, die durch den aktuellen Analyseauftrag nicht autorisiert sind. |
| `STAGE3_SOURCE_NOTES.md` | Neu; Basiscommit korrekt. Wiki und älterer Timing-Mod sind Hintergrund, kein 4.5.3-Nachweis; keine Übernahme fremder Crisis-Overrides. |
| `apply_stage3_docs.py` | Nur gelesen. Enthält fünf passende Blob-Prüfungen, zehn Overlay-Ziele und vier Append-Ziele. Nicht ausgeführt, auch nicht zum Anwenden der Dokumente. |
| `docs/architecture/adr-001-galactic-crisis.md` | Neu; zentrale Ausnahme von ausschließlich reichslokalem Zustand für Stage III. Persönliche Geschichte bleibt lokal. |
| `docs/architecture.md` | Ersatz. Löst den grundsätzlichen Widerspruch zur alten Singleton-/Opt-out-Regel in dieser Datei. Keine Änderung bestehender Gameplay-Logik nötig. |
| `docs/phases/stage-iii-acceptance.md` | Neu; 32 Kriteriengruppen T01–T06, E01–E07, F01–F07, R01–R07, N01–N05. Gute Grundlage; ergänzt werden müssen insbesondere Migration, Zielkonkurrenz, Budgeterschöpfung und Kohorten-Übernahme. |
| `docs/phases/stage-iii-engine-contract.md` | Neu; sinnvolle technische Sperren. Negative Midgame-Vergleiche und Setting-Zugriff sind jetzt quellenbelegt; Laufzeitprüfung bleibt offen. |
| `docs/phases/stage-iii-implementation-plan.md` | Neu; richtige Reihenfolge Engine-Nachweis → Funktion → Expansion. Für Planung um Abhängigkeiten, einzelne Nachweisausgänge, Abbruchregeln und konkrete DoD erweitert. |
| `docs/phases/stage-iii-military-crisis.md` | Ersatz der bisherigen kurzen Richtungsbeschreibung. Definiert erstmals die globale Krise, drei Funktionen, vier Einheitenrollen, drei Abschlussformen und universelle Belastung. Enthält noch die unten genannten Zielkonflikte. |
| `docs/phases/stage-iii-narrative-outline.md` | Neu; fünf dramaturgische Abschnitte, drei Reichsperspektiven, keine vorzeitige Auflösung. Wissen muss lokal erfasst werden, obwohl der Krieg global ist. |
| `docs/phases/stage-iv-ascension.md` | Ersatz mit klarerer Grenze. Globaler Sieg verleiht weder persönliche Zustimmung noch Ascension oder Heilung. Keine Stage-IV-Implementierung Teil von Stage III. |
| `docs/story-bible.md` | Ersatz; galaktische Eskalation passt zur bestehenden Vier-Stufen-Struktur. Autorenhypothese zu den Architekten bleibt ausdrücklich unveröffentlichte Hypothese. |
| `updates/content-migration.append.md` | Ergänzung für vorhandene Migrationsmatrix. Trennt neues Globalschema von alten persönlichen Timern und Callback-Schlüsseln. Keine tatsächliche Migration geliefert. |
| `updates/phase-ii-resonance.append.md` | Ergänzung zur bestehenden Stage-II-Spezifikation. `epoch_res_stage_iii_ready` bedeutet persönliche Bereitschaft, niemals globalen Start. |
| `updates/technical-contract.append.md` | Ergänzung; notwendige Ausnahme vom bisherigen Verbot globaler Singleton-Zustände. Keine Garantie für MP und strategische KI. |
| `updates/testing.append.md` | Ergänzung; korrigiert pauschale Opt-out-Abnahme und ergänzt globale Testmatrix. Gemeldeter Hauptpfad-Erfolg wird korrekt als begrenzte Evidenz beschrieben. |

**Zusätzlicher Dokumentationsbefund:** Der Apply-Helfer beseitigt nicht alle alten pauschalen Aussagen. In `docs/phases/phase-i-first-contact.md:11` steht weiterhin, Exit blockiere spätere Kampagnen-Dispatches; in `docs/phases/phase-ii-resonance.md:23` steht „permanent Stop blocks later stages“. Append-Texte und ADR grenzen dies ein, die Formulierungen bleiben aber auslegungsbedürftig. `docs/testing.md:53` und weitere historische Runtime-Hinweise bleiben neben neueren Erfolgsaussagen stehen. Vor Entwicklung eine klare Geltungsregel dokumentieren: persönliche Fortsetzung bleibt gesperrt; öffentliche Stage-III-Wirkung ist die ausdrücklich benannte Ausnahme. Historische Fehlerberichte erhalten Commit/Datum, keine pauschale Umdeklaration aller Tests zu erfolgreich. Bestehende Stage-I/II-Spezifikationen müssen dafür jetzt nicht geändert werden; ein Stage-III-Integrationsvertrag kann die Ausnahme eindeutig voranstellen.

**Werkzeugrisiko des Apply-Helfers:** Vorabprüfungen verhindern typische Konflikte, die anschließende Schreibschleife ist jedoch keine atomare Dateisystemtransaktion. Text-Ersetzungen werden bei fehlendem Suchtext still übersprungen, und neue/Append-Ziele haben nicht dieselbe Baseline-Absicherung wie die fünf Ersatzdateien. Bei späterer Anwendung Änderungen einzeln prüfen; das Skript ist keine fachliche Merge-Prüfung. Zudem nennt die Layoutskizze `common/ship_designs` und `common/planet_modifiers`; das Repository verwendet `common/global_ship_designs` und `common/static_modifiers`. Künftige Dateien an tatsächlich belegte Verzeichnisse anpassen.

## 3. Architekturentscheidungen

### 3.1 Eine Krise, unabhängige Antworten

**V:** ein autoritativer galaktischer Lebenszyklus, ein eigener Stage-III-Gegner, ein begrenzter Objektbestand. Kein Gegner je Teilnehmer und kein Spielerreich als dauerhafter Koordinator. Die vorhandene Stage-II-Fraktion `epoch_nullwarden` bleibt unverändert: sie hat strategische KI, Bombardement und Angriffe auf unbewaffnete Orbitalstationen ausdrücklich deaktiviert und ist für den neuen Krieg ungeeignet.

Vier Zustandsebenen:

| Ebene | Verantwortet | Darf nicht bewirken |
|---|---|---|
| Galaxie | Schema, Aktivierung, Lebenszyklus, Auflösungs-Tombstone, kanonischer Gegner-/Front-Verweis | alte persönliche Flags setzen oder Zustimmung ersetzen |
| Krisenträger | begrenzte Front-/Flottenregister, Budgets, Phasen, Quellen, Kommandant, Wiederherstellungsdaten | Eigentum fremder Objekte aus Namensähnlichkeit ableiten |
| Reich | Teilnahme am öffentlichen Geschehen, Wissen, Vorbereitungsarbeit, Anfangskohorte, Forschungsprojekte, nachgewiesene Beiträge, einmalige Auszahlung | globale Krise neu starten, fremde Forschung erben |
| Physisches Objekt | Krisen-ID, Rolle/Funktion, Quelle, Zustand, Eigentümer und Version/Generation | fehlenden Verweis als Vernichtung oder Projektabschluss behandeln |

Konkrete Speicherbefehle werden erst nach dem Runtime-Gate ausgewählt. Globale Flags und globale Event-Targets sind Q-belegt; daraus folgt keine frei verfügbare Syntax `set_global_variable`. Zahlen können auf einem validierten persistenten Träger liegen. Unabhängig davon bleibt ein globaler Abschlussmarker bestehen, auch wenn der Krisenträger nach dem Ende entfernt wird.

**V – Zustandsmaschine:** ruhend → Vorbereitung offen → Aktivierung reserviert → aktive Fronten → Konvergenz → Auflösung läuft → aufgelöst. Zusätzlich ein diagnostizierbarer Wiederherstellungszustand für inkonsistente Objekte. „Aktivierung reserviert“ wird vor den ersten Erzeugungen gesetzt; Unterzustände markieren bereits erledigte Schritte. Ein halbfertiger Start wird fortgesetzt, kein zweiter Start erzeugt. Diese Reihenfolge ist ein Entwurf, keine behauptete Engine-Transaktion.

Vor M reichen globale Flags und zeitlich begrenzte lokale Vorbereitungsangebote; es müssen noch keine militärischen Gegnerobjekte existieren. Auflösung stoppt zunächst alle Spawns, sperrt wiederholte Rewards und bereinigt danach ausschließlich nachgewiesene Stage-III-Objekte. Eigene Cleanup-Kennzeichen verhindern, dass scriptseitige Entfernung als Kampferfolg gezählt wird.

### 3.2 Kein erfundener Host-Schalter

**V:** gemeinsame Spielsimulation und globale, idempotente Ereignisse verwenden; keinen unbelegten `is_host`-Trigger voraussetzen. Globale On-Actions sind im Vanilla-Quelltext vorhanden, ihre additive Zusammenführung mit mehreren Moddateien und ihr Verhalten in MP müssen praktisch geprüft werden. Kein Client-UI-Klick darf die einzige Startquelle sein. Verlust des ersten teilnehmenden Reiches darf weder Uhr noch Krise beenden.

### 3.3 Zeitfenster statt privater Startuhr

**V:** Vorbereitung prüft relativ `mid_game_years_passed >= -20` sowie `< 0`; globaler Ausbruch prüft `>= 0`. Dies ist ein **quellengestützter Syntaxkandidat**, noch kein getestetes Stage-III-Script. Globale monatliche Kontrolle mit billigen Frühabbrüchen vermeidet eine Startverzögerung um ein ganzes Jahr und repariert verpasste Hooks; der Midgame-Puls ist ein ergänzender Auslöser. Keine täglichen Galaxiescans, keine feste Jahreszahl, keine Änderung des Stage-II-Einladungstimers.

Die private Vorbereitung verlangt bei Angebot und Abschluss `epoch_res_complete`, `epoch_res_stage_iii_ready`, keinen permanenten Opt-out sowie tatsächlich bezahlte/abgeschlossene Arbeit. Ein offener Schlussdialog ist keine Zustimmung. Später Abschluss vor M bekommt nur die verbleibende Zeit. Nach M wird keine Vorbereitung rückdatiert. Der globale Ausbruch hat keinerlei Stage-I/II-Voraussetzung.

### 3.4 Flottensteuerung und Anker

**V:** eigener strategischer Controller mit begrenzten Zielen und nativen Reise-/Kampfbefehlen ist die bevorzugte Ausgangsoption für kontrollierbare Fronten und endliche Budgets. Vanilla-Drohnen und Marauder zeigen geeignete Befehle. Als Vergleich im Engine-Gate eine eigene Country-Type-Definition mit dem Vanilla-`berserk_military_minister_module` testen. Erst messen, dann auswählen; keine gleichzeitige konkurrierende Kontrolle derselben Flotte durch eigene Orders und einen Minister.

KI-Minister sind native, intern nicht vollständig einsehbare Implementierungen. Vorhandene Module beweisen weder ihre freie Wiederverwendbarkeit unter neuem Typnamen noch die Einhaltung unserer Ziele, Rückzüge und Spawnlimits. Horde-Innenminister sind besonders riskant, wenn sie außerhalb des Stage-III-Budgets Stationen oder Einheiten aufbauen.

**V:** Anker bevorzugt als ortsfestes, bewaffnetes Stationsschiff in einer eigenen Flotte, vergleichbar zur Gray-Tempest-Fabrik. Das belegt ein wirklich angreifbares Objekt, ohne eine fremde Sternenbasis zu ersetzen oder ein DLC-Megastruktursystem vorauszusetzen. Genaues Design, Immobilität, Zielbarkeit und Callback müssen getestet werden. Eine Sternenbasis ist nur dann Alternative, wenn Eigentum, Ersatz und Zerstörungs-/Eroberungsregeln separat validiert sind. Ein Ambient Object alleine genügt nicht.

Funktionen und Objekte getrennt registrieren: Interdiktion, Narbenwirkung, Verstärkung. Zwei Stationen auf einer kleinen Karte können drei Funktionen tragen. Zerstörung eines solchen Ankers schaltet alle ihm zugeordneten Funktionen einmal ab. Wissenschaftliche Stilllegung nutzt denselben Funktionszustand, meldet aber keinen Abschuss.

### 3.5 Planetensystem: Wiederverwendung ohne alte Missionssteuerung

**V:** bestehende Deposit-Definitionen und deren reale Wirtschaftseffekte wiederverwenden, aber Stage-III-spezifische Zustandsführung, Entscheidungen und Zielregister hinzufügen. Alte `epoch_res_infect`-, `epoch_ii_set_site_*`- und Kampagnen-Abschlusseffekte nicht als universelle Krisen-API verwenden. Sie kennen alte Ziele, Kapitel, Erstattungen und Aufräumzustände.

Priorität je Welt: geschützte/abgeschlossene Altzustände respektieren; aktive persönliche Missionsziele vor widersprechenden Familienwechseln schützen; sonst passenden bestehenden Familienzustand einsetzen. Wo kein konfliktfreier Platz existiert, einen echten befristeten Stage-III-Wirtschaftsmodifier verwenden. Dieser ist keine vierte Feature-Familie und darf alte Dauerschäden nicht entfernen. Welche Altflags bei Wiederverwendung eines Deposits notwendig sind, muss im Integrations-Gate geklärt werden: nicht reflexartig Stage-II-Flags setzen, denn alte Migrationspfade werten sie aus.

## 4. Technische Nachweise aus der Installation

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

### Bodeninvasion und territoriale Kontrolle

**Befund:** Mobile Angriffe und planetarer Krisendruck sind deutlich besser belegt als eine neue vollständige Landinvasions-KI. Die Spezifikation verlangt keine vorbehaltlose klassische Kriegs-/Besetzungsimplementierung; ihr Engine-Vertrag lässt eine ehrliche Systemkontroll-/Planetengefahr-Alternative zu.

**V:** frühe spielbare Version mit realen Flotten, zerstörbaren Ankern und validierter orbitaler/systemischer Bedrohung planen. Bodenarmeen nur nach gesondertem Nachweis aufnehmen. Wenn Besetzung verbindlich gewünscht wird, wird der Invasionsnachweis ein P0-Blocker: Transport → Eskorte → gültige Landung → Bodenkampf → Eigentums-/Kontrollfolge → Rückeroberung → Save/MP. Keine direkte `set_owner`-Übernahme als Ersatz für eine behauptete Invasion. Ebenso keine UI-Behauptung „erobert“, wenn lediglich ein feindlicher Verband im System steht. Ein Verzicht auf Bodeneroberung ist vor Umsetzung als bewusste Reichweitenentscheidung zu bestätigen.

## 5. Widersprüche, Lücken und begründete Lösungen

| Priorität / ID | Problem und technische Folge | V – empfohlene Festlegung |
|---|---|---|
| P0 / K01 | Universelle neue Kontamination kollidiert mit Schutz bestehender contained/controlled/healed-Welten, besonders bei nur einer Kolonie. Manche bereits geschützte Nichtteilnehmer besitzen keine freie Familie. | Schutz hat Vorrang. Feature nur „wenn konfliktfrei geeignet“; sonst echter zusätzlicher Krisenmodifier. Abnahmetext E03 erhält diese Ausnahme. Keine Schutzaufhebung und kein zweites Deposit derselben Familie. |
| P0 / K02 | Stage I/II können bei M noch laufen. Ihr späterer Callback darf dieselbe Welt verändern; umgekehrt darf III keine bezahlte Altaufgabe ändern oder abschließen. | Aktive Missionsziele bevorzugt aus III-Familienwechseln ausschließen. Bei Ein-Kolonie-Fall Overlay; beim späteren Altcallback III-Druck aus eigener Zustandsführung weiterführen, ohne Altflags zu schreiben. Geteilte Welt explizit testen. |
| P0 / K03 | Vorhandene Setter/Migration sind keine nebenwirkungsfreie API. Blindes Aufrufen könnte Altzustände entfernen, Credits vergeben oder Recovery auslösen. | Neue, flache III-Operationen für nur III-eigene Zustände, bestehende Deposit-Definitionen lesen/wiederverwenden. Kein Refactoring alter Setter; Invarianten beider Systeme separat nachweisen. |
| P0 / K04 | „Uninitiated stärker“ misst keine konkrete Größe. Einige Kontaminations-Deposits geben zusätzlich Forschungsboni; mehr Icons ist nicht zwingend mehr Schaden. | Bei identischer Wirtschaft und Klasse gemessene Produktions-/Stabilitätsdeltas vor/nach Ausbruch sowie über festen Horizont vergleichen. Forschungsboni mitbilanzieren; vorbereitete < erfahrene < uninitiierte Zusatzbelastung als Ziel. Keine gleiche Rohzahl zwischen unterschiedlichen Reichsklassen behaupten. |
| P0 / K05 | Migration nach M könnte eine bereits weit fortgeschrittene Galaxie ohne Warnung überfallen. Paket enthält keine Einführungsregel. | Fresh-/Pre-P-Saves zuerst als unterstützt definieren. P..M nur verbleibendes Fenster. Erstinstallation nach M zunächst nicht als automatisch kompatibel ausgeben; separate, ausdrücklich angenommene Opt-in-/Schonfrist-Politik nötig. Bestehende III-Saves hingegen immer normal wiederaufnehmen. |
| P0 / K06 | M..M+1-Startgarantie und sichere 2–4 Fronten können in voll belegten/isolierten Galaxien unvereinbar sein. | Begrenzte Suche mit abgestufter Topologie, Funktionen zusammenlegen. Keine Enteignung, kein Hauptstadt-Notspawn. Bei weiterem Fehlschlag diagnostizierbar pausierter Start ohne Sieg; Entscheidung nötig, ob sichere Erzeugung zusätzlichen Systems zulässig ist. Keine stille Zusage der Jahresfrist unter unmöglichen Bedingungen. |
| P0 / K07 | „Host-only“ im ADR setzt möglicherweise eine nicht verfügbare Engine-Schnittstelle voraus. | Als „einmalige autoritative Simulation“ spezifizieren. Globale Hooks, früh gesetzte Sperren, idempotente Unterphasen; MP beweisen, keinen Host-Trigger erfinden. |
| P1 / K08 | Wissenschaftsroute verlangt Zugriff auf zwei Funktionen, globale Regel verlangt Abschaltung aller Funktionen. Bei nur zwei physischen Stationen darf „multi-site“ nicht unmöglich werden. | Einstieg über zwei unterschiedliche Funktionen, reale Arbeiten an mindestens zwei validen Orten; Finale schaltet nachweislich alle übrigen Funktionen und den Kommandoknoten still. Funktions-IDs statt Stationsanzahl als objektive Grundlage. |
| P1 / K09 | Koalition ist keine logisch unabhängige dritte Siegbedingung; mehrere Reiche können auch militärisch oder wissenschaftlich gewinnen. | Zwei physische Auflösungsverfahren plus Kooperationsmodus mit eigenem Anerkennungs-/Beitragsmodell. Für Spieler weiter drei erkennbare Wege, intern ein gemeinsamer Validator. Einzelreich-Galaxie darf nicht auf Koalition warten. |
| P1 / K10 | Endlicher Spawnvorrat kann erschöpfen, bevor Kommandant erscheint oder wissenschaftliche Ziele erreichbar werden. | Endzielbudget reservieren, Erschöpfung führt zu angreifbarem Restnetz, niemals zu Sieg per Zeit. Auslösung der Konvergenz durch echte Frontresultate oder nachgewiesene Entdeckung, keine Pflicht zu nicht mehr erzeugbaren Kills. |
| P1 / K11 | „Station gesichert“/„deaktiviert“ unpräzise; fehlender Verweis könnte fälschlich Erfolg bedeuten. | Zustände aktiv, umkämpft, physisch zerstört, wissenschaftlich stillgelegt, Referenz ungeklärt, ggf. geborgen unterscheiden. Nur validierte Transition ist Fortschritt. Reparatur sucht Identität; Ersatz hat Generation und begrenzte Stückzahl. |
| P1 / K12 | Kohorte nach Eroberung, Abspaltung, späterer Stage-II-Fertigstellung oder Unterwerfung undefiniert. | Anfangskohorte bei Erstaufnahme einfrieren; spätere Gegenmaßnahmen ändern Schutz, nicht Vergangenheit. Materieller Schaden bleibt am Planeten. Abspaltung erbt keinen privaten Fortschritt und löst nicht dieselbe Startstrafe auf bereits erfassten Welten erneut aus. |
| P1 / K13 | Neue Kolonien könnten die Anfangsstrafe endlos erweitern; Eigentümerwechsel könnte wiederholte Strafe erzeugen. | Einmalige Anfangsquote je Reich und Expositionsgeneration je Welt; danach nur begrenzte, quellengebundene aktive Ausbreitung. Neue Kolonie ist kein neuer globaler Ausbruch. |
| P1 / K14 | Globale Chapter-Phase und unterschiedliches Wissen geraten auseinander; „kein Wissen ohne Teilnahme“ betrifft öffentliche Berichte nicht gleich. | Globale Militärphase von persönlichem Kenntnisstand trennen. Öffentliche, neutrale Basisinformationen für Handlungsfähigkeit; frühere persönliche Erinnerungen nur nach lokalen Belegen. Kein Stage-II-Abschluss durch Öffentlichkeitsarbeit. |
| P1 / K15 | Zahlen für Wellen, Verlustbegrenzung, Flottenstärke, Replan, Projekte und Belohnungen fehlen. | Vor Contentausbau eigenes Parameterblatt mit Einheiten, Hardcaps und Testkorridoren; initiale Werte unten sind Vorschläge. Fähigkeit/Difficulty nicht fortlaufend zur Bestrafung erfolgreicher Spieler hochskalieren. |
| P1 / K16 | Sondertypen, Nomaden/kolonielose spielbare Reiche, Subjekte und DLC-Funktionen sind nicht vollständig klassifiziert. | Matrix unten und konkrete verfügbare Typen gegen Installation validieren. Keine Gleichsetzung „nur souverän“ = „keine Vasallen“. Krisenverhalten ohne Community und ohne optionale DLC-/Gigas-Abhängigkeit gewährleisten. |
| P2 / K17 | Zehn bis 25 aktive Jahre sind nur Balancingziel und könnten als automatische Endfrist missverstanden werden. | Als gemessenen Zielkorridor behandeln, nie als Siegesbedingung. Langsame oder verlorene Kampagnen dürfen länger dauern und weiterhin lösbar bleiben. |

K01–K07 brauchen vor Produktionsentwicklung eine explizite Entscheidung oder einen erfolgreichen technischen Nachweis. Die hier vorgeschlagenen Regeln sind keine stillschweigende Änderung der fachlichen Grundlage.

## 6. Operative Mechaniken und Grenzen

### 6.1 Globale Aktivierung und Reichsaufnahme

Globale Aktivierung verwendet ausschließlich eigene `epoch_s3_*`-Identitäten; keine Vanilla-Krisenflags oder Stage-II-Schlüssel überschreiben. Sie darf parallel zu Khan, Tempest und Voidworm-Krise bestehen. Startmarkierung, Gegnererzeugung, Frontregistrierung, Exposition und Berichtszustellung sind einzeln wiederholbar abgesichert. Länder- und Typwechselhooks dienen als schnelle Aufnahme, begrenzte reguläre Überprüfung als Reparatur. Keine Rekursion aus `on_country_created`, wenn gerade der eigene Krisengegner entsteht.

**V – Reichsmatrix:**

| Kategorie | Öffentliche Krise / Planeten | Militär / persönliche Geschichte |
|---|---|---|
| Normales biologisches Reich, Hive, Machine; menschlich/KI; auch Genozidreich | volle Aufnahme, klassenpassende Belastung | angreifbar; Prep nur mit abgeschlossener/fortgesetzter Stage II |
| Vasall, Protektorat, sonstiges normales Subjekt | ebenso; keine Immunität durch fehlende Souveränität | vorhandene Diplomatie respektieren; kein Community-/Koalitionszwang |
| Spielbares mobiles/kolonieloses Reich, soweit konkrete Typen vorhanden | öffentliche Aufnahme; Flotten-/Systemgefahr oder validierter Wirtschaftsmodifier | keine ungültige `capital_scope`-/Colony-Annahme |
| Fallen/Awakened Empire | als Sondertyp; echte Kolonieeffekte erst nach Test, keine Standardquest unterstellen | keine pauschale neue Kampfunverwundbarkeit; Interaktion testen |
| Marauder, Enklave, Guardian | kein pauschales normales Kolonial- oder Questmodell | Hostility-Matrix testen; Vanilla-Ausnahmen dokumentieren, nicht heimlich neu neutralisieren |
| Andere Krise | kein persönlicher Fortschritt oder reguläre Startstrafe | physische Feindschaft/Neutralität konkret testen; keine Änderung fremder Krise |
| Pre-FTL | keine normalen Raumfahrtreich-Nachrichten | keine falsche Reichsaufnahme; Sonderfolgen nur gesondert entwerfen |
| Beobachter | geeignete öffentliche Beobachtung ohne Ressourcen-/Questgewährung | kein Teilnehmer/Reward-Empfänger |
| EPOCH-Stage-III-Gegner | zwingend ausgeschlossen von eigener Bevölkerungsexposition und Teilnehmeraufnahme | eigene Registry/Operationen |

Das ist eine Test-/Designmatrix, keine Behauptung bereits bestandener Interaktion aller Engine-Typen. „Alle betroffen“ bedeutet garantierte passende Anfangswirkung plus Teilnahme am gemeinsamen Bedrohungsraum; es verspricht keinen zwingenden einzelnen Flottenbesuch in jeder abgeschotteten Enklave der Karte.

### 6.2 Flotten, Fronten und finite Verstärkung

Vier Rollen bleiben erhalten: Hunter, Enforcer, Anchor, Silent Commandant. Größen beruhen auf echten Designs und Komponenten. Konkrete benötigte Assets, DLC-Freiheit und Designverzeichnis vor Umsetzung prüfen. Stil von Stage II wiederverwenden, nicht dessen Objekte oder Logik.

Jede operative Flotte hat Front, Quelle, Rolle, aktuelle Aufgabe und gültiges Ziel. Zielauswahl begrenzt nach Reichweite, Zugang, strategischem Wert und Fairness; Auswahl speichern. Pfadtests nur für wenige Kandidaten und bei realer Umplanung, da die Engine `can_access_system` als teuer dokumentiert. Rückzug reist zu einem noch lebenden Anker, statt zu teleportieren. Zielzerstörung, neue Blockade, längere Untätigkeit und verlorener Anker lösen definierte Neuplanung aus.

**V – Startwerte für den technischen Test, nicht Balance-Freigabe:** höchstens vier physische Frontanker, höchstens zwölf mobile Kampfverbände gleichzeitig, ein einmaliger Kommandant außerhalb dieses mobilen Limits; insgesamt höchstens 24 mobile Spawnvorgänge einschließlich Erstaufstellung und Ersatz. Pro Quelle ein Cooldown und Teilbudget; Ersatz verbraucht denselben Gesamtvorrat. Ein gesondertes, vorab reserviertes Kommandobudget verhindert Softlocks. Skalierung dieser Werte nach Kartengröße wird erst mit gemessener Performance und Spielstärke beschlossen. Bau-/KI-Module dürfen diese Limits nicht umgehen.

Aktive-Flottenlimit und Lebenszeitbudget sind getrennte Größen. Gespaltene, fusionierte, deaktivierte oder entkommene Einheiten dürfen nicht Budget regenerieren. Ankerersatz ist ein eigener begrenzter Vorgang, keine Gratiserzeugung eines neuen Frontbudgets. Wellen nach Delay prüfen Quelle und Krisenphase erneut bei Ausführung; ein bereits eingeplanter Spawn darf nach Relay-Tod oder Sieg nicht mehr durchlaufen.

### 6.3 Planetare Belastung und Schadensmessung

Vor jedem Effekt: Scope-Typ, aktueller Eigentümer, Kolonie/Gültigkeit, geschützter Zustand, vorhandene Familienzustände und eigene Expositionskennung prüfen. Physischer Planet und Colony sind in 4.5.3 verschiedene Identitäten. Wirtschaft/Deposits am passenden Carrier, räumliche Ziele am physischen Objekt führen. Gemeinsame Planet-Flags beweisen keine Objektidentität. Eroberung überträgt physische Schäden, nicht die persönlichen Projekte/Rewards des Vorbesitzers.

**V:** Prepared braucht tatsächlich abgeschlossene Verteidigung, nicht nur ein Angebot. Experienced ist abgeschlossen + Continue ohne fertige Vorbereitung; alle übrigen sind anfänglich Uninitiated. Contained/controlled/healed und bereits bezahlte Studienresultate nicht verschlechtern. Narben separat belassen. Silent Structure nur bei real vorhandener beziehungsweise tatsächlich neu erzeugter physischer Struktur; kein bloßes Deposit als behauptete Ausgrabungsstätte.

Anfangsquoten aus dem ZIP als Balancingbänder übernehmen, aber nicht als Wirtschaftsnachweis: 1, 2–4, 5+ Kolonien; jeweils gedeckelte Auswahl. Für Vergleichstests identische Weltwirtschaften klonen, M vor/nach Effekt messen und Projekte zunächst nicht ausführen. Stabilität, Ressourcen und Forschung getrennt ausweisen, dann eine begründete Gesamtbewertung. Auf einer reinen Energiewelt beweist eine Nahrungsstrafe keine wirtschaftliche Betroffenheit; Nullproduktion und Nomaden benötigen validierte Alternativen. Baseline-Dauerschaden wird nicht als neue Krisenbelastung angerechnet. Anschließend bezahlte Gegenmaßnahmen testen, einschließlich KI-Ausführung.

### 6.4 Fortschritt, Sieg und individuelle Beiträge

Militärischer Sieg: jede registrierte Ankerfunktion in einem bewiesenen Endzustand und Kommandant wirklich zerstört. Wissenschaft: militärisch/strategisch gesicherter Zugang, echte ortsgebundene Forschung, gültiger finaler Knoten und nachgewiesene Abschaltung sämtlicher restlicher Funktionen; Kommandant wird stillgelegt/abgezogen, kein Abschuss erfunden. Koalition nutzt dieselben physischen Bedingungen mit mindestens zwei eigenständig nachgewiesenen Beiträgen verschiedener Reiche; sie ist kein zwingender Weg für isolierte oder allein verbliebene Reiche.

Globale Anerkennung eines zerstörten Krisenziels hängt nicht davon ab, ob ein Spieler den letzten Schuss abgegeben hat. Persönliche Anerkennung unterscheidet finalen Abschuss, belegte Kampfteilnahme, wissenschaftliche Arbeit und unbestätigte Mitwirkung. `on_space_battle_won` ist kein Zerstörungsbeweis; Rückzug/Disengagement darf keinen Zielabschluss auslösen. Verworfene oder fehlende Targets führen in Recovery, niemals direkt in Sieg. Ohne belastbare Damage-Daten keine erfundenen prozentualen Kill-Splits.

Vorhandene Stage-II-Join-/Exit-Heuristiken werden nicht als bereits gesicherter III-Beweis übernommen. Bei unsicherer Reihenfolge globale Zielvernichtung und konservative nationale Auszeichnung trennen. Cleanup-Zerstörung, Skriptentfernung, Rückzug und echter Kampftod erhalten unterschiedliche Gründe. Genau-einmal-Rewards brauchen reichslokale Abschlussmarker vor der Auszahlung. Sieg beseitigt militärischen Nachschub, nicht alte Narben oder Opt-out.

### 6.5 Savegames, KI und Multiplayer

Save-Unterstützung ist eine explizite Versionsmatrix: frisches Spiel; Stage-I-/II-Save ohne III; aktives III-Save; aufgelöstes III-Save; zukünftige unbekannte Schema-Version. Unbekanntes höheres Schema nicht still neu initialisieren. Prototype-Stage-II-Suspension bleibt unangetastet: sie kann den globalen öffentlichen Krieg erleben, erhält aber keine erfundene private Vorbereitung.

Persistieren: Aktivierung und Abschluss, Funktionszustände, tatsächliche Vorbereitungsabschlüsse, Anfangsexposition, verbrauchte Budgets, Objektgenerationen und bezahlte Forschungsschritte. Beim Laden nur fehlende Referenzen aus geprüfter Registry wiederfinden. Ein weiterhin existierender markierter Anker ist kein Grund zur Neuerzeugung. Ist der Träger unerwartet vernichtet, erst verbleibende Krisenobjekte untersuchen; Wiederaufbau nur aus hinreichend persistenten Fakten. Andernfalls Recovery-Zustand ohne Siegesprämie und ohne Flottenduplikation.

KI muss Projekte tatsächlich zuweisen, Entscheidungen bezahlen, Verteidigung aufbauen und erreichbare Krisenziele bekämpfen. `ai_weight` und `ai_chance` sind nur Auswahlhilfen. Keine automatische Ersatz-Vollendung nur weil eine KI keinen Wissenschaftler schickt. Ressourcenknappheit darf Aufschub/defensiven Weg ermöglichen; die KI darf sich nicht durch wiederholte kostspielige Notmaßnahmen selbst ruinieren.

MP-Abnahme umfasst Host und Client mit zwei eigenständigen Geschichten, gleichzeitige Aktionen, Save/Reload, Spielerwechsel zu KI und Wiederbeitritt. Zufallszielwahl ausschließlich innerhalb synchronisierter Spielsimulation und Ergebnis persistieren; identische Kandidaten-/Iterationsreihenfolge nicht ohne Nachweis annehmen. Keine lokale UI- oder SP-Ladehook-Recovery als autoritative Quelle. Keine unbelegte Garantie über deterministische Callback-Reihenfolge.

## 7. Priorisierte Arbeitspakete

Alle folgenden Implementierungs-/Probe-Arbeiten sind **zukünftig und bis zur Freigabe nicht begonnen**. Auch ein temporärer Testmod ist Implementierung und fällt unter die Freigabegrenze. P0 blockiert Produktionsentwicklung, P1 gehört zur spielbaren Kernversion, P2 zur Veröffentlichung/optionalen Erweiterung.

| Paket | Prio / Abhängigkeit | Konkretes Ergebnis | Tests und Definition of Done |
|---|---|---|---|
| AP0 – Integrationsvertrag | P0; Freigabe | K01–K07 entscheiden; eingefrorener main-/Build-Fingerprint; unterstützte Saves/DLCs, Reichsmatrix, Parameterblatt und unveränderliche Altdateien festhalten | jede fachliche Anforderung einer Zustands-/Testregel zugeordnet; keine widersprüchliche Ein-Kolonie-/Schutzregel; Dokumentation klar als Design gekennzeichnet |
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

Empfohlene spätere Änderungsschnitte: ein zusammenhängendes Engine-/Schema-Fundament, dann ein durchspielbarer Ausbruch mit echter Front, anschließend übrige Fronten und Auflösungen, zuletzt Abnahme. Keine jetzt zu erstellenden Commits und kein Merge ohne gesonderten Auftrag. Zeit-/Aufwandsschätzungen vor AP3/AP4 wären wegen nativer KI und Planetenkonflikten unzuverlässig; nach G1 anhand des erprobten Steuerungsmodells neu schätzen.

## 8. Testplan und messbare Abnahme

### 8.1 Nachweisstufen

1. **Quellenvertrag:** gültige Befehle/Scopes, installierte Designs/Assets und DLC-Abhängigkeiten; Source-Hashes sichern.
2. **Statische Definitionen und Zustandsmodelle:** Namespaces, Scope-Pfade, Kosten-/Tooltiptrennung, Lebenszeitbudgets, Wiederholungssperren, Familienexklusivität und unabhängige Reiche. Engine nicht nachspielen und dann als Engine-Pass etikettieren.
3. **Gezielte Runtime-Probes:** Uhr, Hook-Merge, Objektlebensdauer, Reise/Kampf, Carrier, MP. Save und Logs vor/nach jedem entscheidenden Schritt.
4. **Zusammenhängende Spielabnahme:** fünf Kapitel, reale Verluste, bezahlte Gegenmaßnahmen und alle Auflösungen in getrennten Save-Zweigen; erst dann gemeinsame Spielerbewertung anfordern.

Jeder Runtime-Befund nennt Mod-Commit, Spielbuild/Checksum, Seed soweit verfügbar, Karte, M, Difficulty/Krisenfaktor, Reich/Origin, DLC-/Modliste, Save-Checkpoint, erwartetes und tatsächliches Resultat, Log und Screenshot. Historische Logs sind keine frischen Erfolge.

### 8.2 Ergänzungen zu den 32 ZIP-Kriterien

| ID | Zusätzlicher Test | Erwartung |
|---|---|---|
| X01 | gleicher Planet ist aktives Stage-I/II-Ziel und einzig verfügbare Kolonie bei M | III-Overlay statt widersprechendem Familienwechsel; Altcallback behält ursprüngliche Kosten, Ergebnisse und Fortschritte |
| X02 | verlorenes Anchor-Target bei weiterhin existierendem Anchor | Identität wiedergefunden; kein Ersatz und kein Erfolg |
| X03 | zwei Spieler vollenden dasselbe Sabotageziel am gleichen Tag | globale Funktion einmal stillgelegt; nationale Beiträge nur nach wirklicher Leistung; keine doppelte Belohnung |
| X04 | Relay-Tod unmittelbar vor geplantem Spawn / Sieg unmittelbar vor Welle | anstehender Callback prüft Quelle/Phase und erzeugt nichts |
| X05 | Split/Merge, MIA, Retreat, Kommandantschiff stirbt bei überlebender Eskorte | keine Budgetregeneration; Schiffsziel und Flottenziel sauber getrennt, keine Verwechslung von Rückzug und Tod |
| X06 | alle normalen Verstärkungsbudgets erschöpft | kein Autosieg, Finale weiterhin physisch möglich, kein Pflichtkill nicht existierender Gegner |
| X07 | neue KI-/Spielerreiche durch Abspaltung, Übernahme, Unterwerfung | öffentliche Aufnahme einmal, keine privaten Erbquests; kein erneuter Planetenschaden allein durch Ownerwechsel |
| X08 | alle Welten enthalten geschützte oder studierte Altzustände | keine Verschlechterung; messbarer III-Effekt über geeignete Alternative; E03-Ausnahme dokumentiert |
| X09 | Spiel ohne Community, ohne passende Föderation, nur ein normales Reich | militärischer/wissenschaftlicher Weg lösbar, kein Koalitionszwang |
| X10 | Erstinstallation vor P, zwischen P/M, nach M; zukünftiges unbekanntes Schema | nur ausdrücklich unterstützte Politik; keine stillen rückwirkenden Rewards oder Migrationserfolge |
| X11 | dauerhaftes Save/Reload nach aktivem und nach beendeten Krieg, inkl. MP-Wiederbeitritt und Spieler→KI | Budgets, Auflösung und private Historien erhalten; keine doppelte Krise/Rewards; OOS separat geprüft |
| X12 | voll belegte Karte, getrennte Hyperlane-Komponenten, blockierte Forschungsroute | begrenzter Retry/saubere Diagnose; kein Hauptstadt-Notspawn, kein Erfolg aus Unzugänglichkeit |
| X13 | unvorbereitetes Ein-Kolonie-Reich mit Nullproduktion einer bestraften Ressource | passende reale Zusatzwirkung; wirtschaftlicher Nachweis statt bloßem Icon |
| X14 | Performance auf kleiner und großer Karte, frühe Phase versus maximal aktive Krise | keine täglichen Vollscans; begrenzte Registry, Replan-/Pfadprüfungszahl und Scriptkosten; vor Release einen anhand Baseline gemessenen Grenzwert vereinbaren |

Testabdeckung systematisch verteilen: mindestens ein verbundenes Spiel je Bio/Hive/Machine, zwei unterschiedliche M-Werte in unabhängigen Spielen, ein Nullteilnehmer-Spiel und ein MP-Spiel mit Host/Client. Spezielle Fälle über reproduzierbare Saves und kleine Probes ergänzen; nicht behaupten, ein einzelner Hauptpfad decke das kartesische Produkt aller Eigenschaften ab. Alle drei Abschlussformen aus gemeinsamen Vor-Finale-Checkpoints testen. Bei fehlender tatsächlicher Gigas-Version bleibt diese Kombination unbestätigt und wird nicht als allgemeine Core-MP-Garantie verkauft.

### 8.3 Aktueller statischer Befund

Bestehendes `scripts/test_epoch_regressions.ps1` unverändert gegen die installierte Vanilla-Basis ausgeführt. Historische Runtime-Logs wurden bewusst nicht als neue Spielabnahme ausgewertet.

- 707 Hauptprüfungen: bestanden.
- 5.287 modellierte Stage-I-Zustandsprüfungen: bestanden.
- 1.135 Resonance-Vertrags-/Interpreterprüfungen: bestanden.
- 33 installierte Vanilla-/Script-Dokumentationsprüfungen: bestanden.
- 1.873 Narrative-/UI-/Baseline-Prüfungen: bestanden.
- Clausewitz-Strukturprüfung für 28 Dateien und Logklassifizierer-Selbsttest: bestanden.
- Gemessene maximale Scripted-Effect-Verschachtelung im vorhandenen Stand: 3; neue III-Aufrufketten brauchen eigene Prüfung und dürfen den in den Altquellen berücksichtigten Grenzwert nicht ausreizen.

Einzelne Parserprüfungen werden durch Teiltests mehrfach aufgerufen; die Zahlen sind keine additiv unabhängigen Runtime-Nachweise. **Keine dieser Prüfungen testet eine implementierte Stage III.** Das Protokoll ist als separate Datei beigefügt.

## 9. Gesamte Definition of Done

Stage III gilt erst als fertig, wenn sämtliche folgenden Aussagen durch passende statische und reale Nachweise getragen sind:

1. Eine einzige Krise startet relativ zum eingestellten M bei 0/1/vielen früheren Teilnehmern, Vorbereitung ausschließlich nach nachgewiesener privater Berechtigung und nur im Fenster M−20 bis M.
2. Alle normalen Raumfahrtreiche einschließlich Subjekte, KI, Nichtteilnehmer und persönlicher Opt-outs werden passend aufgenommen; Sondertypen und kolonielose Reiche sind ausdrücklich geregelt.
3. Echte mobile Gegner kämpfen und planen um; alle drei Ankerfunktionen hängen an sichtbaren, physisch bearbeitbaren Objekten; Verstärkung ist quellenabhängig und endlich.
4. Planetare Zusatzbelastung ist wirklich wirksam und für vergleichbare Uninitiierte stärker; geschützte/abgeschlossene Altzustände und aktive Stage-I/II-Aufgaben werden nicht umgeschrieben.
5. Militärische, wissenschaftliche und kooperative Abschlüsse verlangen tatsächliche Ziele. Kein Fortschritt aus Zeitablauf, Targetverlust, bloßem Bezahlen oder Cleanup-Tod.
6. Verlieren, Rückzug und Wiederaufbau bleiben möglich; Budgets und Recovery erzeugen weder Endlosschleifen noch einen unlösbaren Restzustand.
7. Save/Reload, KI und Host/Client-MP bestehen die definierte Matrix. Bestehende Stage-I/II-Dateien und ihre gültigen Ergebnisse bleiben unangetastet; keine neuen kritischen EPOCH-Scope-/Initialisierungsfehler oder OOS-Befunde.
8. Native Vanilla-Krisen und Core ohne Gigas bleiben funktionstüchtig; optionale Kompatibilität ist gesondert ausgewiesen.
9. DE/EN-Text und UI entsprechen realen Zuständen, unterscheiden öffentliches und persönliches Wissen und verraten die Stage-IV-Auflösung nicht.
10. Ein versioniertes Abnahmepaket enthält Ergebnisse statt nur Kriterien, und offene Einschränkungen werden ausdrücklich benannt. Kein pauschales „MP-kompatibel“ auf Basis eines statischen Tests.

## 10. Empfehlung für die Freigabeentscheidung

Die globale Architektur des ZIP sollte als Planungsbasis erhalten bleiben. Stage II liefert die notwendigen privaten Read-only-Signale bereits; eine Änderung seiner fünf Kapitel ist technisch nicht erforderlich. Das Timing braucht keine feste Jahreszahl und hat nun konkrete negative Vanilla-Vergleiche als Grundlage.

Vor einer vollständigen Contententwicklung empfehle ich eine begrenzte erste Entwicklungsfreigabe für **AP0–AP4 inklusive isolierter Engine-Probes**, anschließend G1 mit tatsächlichen Ergebnissen. Die wesentlichen zu bestätigenden Produktentscheidungen sind: Schutz-/Overlay-Ausnahme für Planeteneffekte; Behandlung laufender Altgeschichten; Unterstützungsgrenze für Erstinstallation nach M; sicherer Spawn-Fallback; und ob echte Bodenbesetzung Pflicht ist. Wissenschaft und Koalition sollten denselben globalen Funktionsvalidator nutzen. Den neuen Gegner getrennt von Stage II und seine gesamte Erzeugung unter einem endlichen Budget führen.

**Diese Analyse ist abgeschlossen. Die Implementierung wurde nicht begonnen. Ich warte ausdrücklich auf deine Freigabe zur Implementierung.**
