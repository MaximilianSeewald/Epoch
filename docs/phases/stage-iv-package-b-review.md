# Paket B – gezielte Nachbesserung von PR #18

Stand: 10.11.2026, Ausgangscommit `b759d3ddf6b1ad82e0b103228fefa114bdda8a6b`, bestehender Branch `codex/stage-iv-package-b`. Keine Neuimplementierung, keine neue Testmod, keine Änderungen an abgeschlossenen Storyentscheidungen. Alle Aussagen zu Spielbarkeit unten sind **statische Verträge und Testziele**, keine Ingame-Abnahme.

## Wilderness, Reichsklasse und Schiffskategorie

Installierte Primärquellen: `00_scripted_triggers.txt` definiert Wilderness über `origin_wilderness`; `is_hive_empire` umfasst dessen Schwarm-Autorität. `07_scripted_triggers_ships.txt` prüft Bio-Schiffe unabhängig über `uses_ship_category = bio_ship`. Wilderness ist also keine ausreichende Prüfung auf Bio-Schiffe. Die nativen Wilderness-Institutionen verwenden eigene Bau-/Biomassepfade; sie sind kein Beleg dafür, dass neue reguläre Spezialistenjobs dort funktionieren. Native `research_subsidies_wilderness` belegt dagegen die Gültigkeit von `planet_researchers_produces_mult` für diese Reiche.

Die pauschale Wilderness-Sperre der 36 Technologien entfällt. Elf ausschließlich konventionelle Hardware-Karten behalten ihre Bio-Schiff-Sperre. S04/S07 und S09 bleiben klassenabhängig; S05/S08 stehen auch Wilderness offen. Der universelle DAG ist für beide Schiffskategorien und beide persönlichen Philosophien erreichbar. Reguläre EPOCH-Jobgebäude bleiben Wilderness verborgen.

Zwei ausschließlich für Wilderness verfügbare, abschaltbare native Erlasse ersetzen die inkompatible Jobwirtschaft:

- **Protokollfertigung:** E04; Startpreis 1.200 Mineralien + 225 Legierungen, keine Kerne. 12 Kerne/Monat gegen 72 Mineralien + 12 Legierungen + 48 Energie. E14 verdoppelt Output und laufende Inputs auf 24 / 144 / 24 / 96. Ein Defizit eines Inputs unterbricht beide Produktionsanteile; keine erfundene Biomasseumwandlung.
- **Protokollintegration:** E04 und P04; Aktivierung 2.000 Energie + 80 Kerne, monatlich 3 Kerne + 12 Energie. Ressourcenproduktion wird pro tatsächlich erforschter Infrastrukturtechnologie erweitert. P04/E05/E13 erzeugen jeweils 3/6/9 Forschung **je Disziplin**; P05 +3 Physik, P14 +6 Physik, S10 +6 Gesellschaft; P06/E06 +10/+20 Energie; E03/E07/E12 +2/+4/+6 Legierungen; S06/S11/S12 +3/+6/+9 Einigkeit. Voll erforscht: 27 Physik, 24 Gesellschaft, 18 Ingenieurwesen, 30 Energie, 12 Legierungen und 18 Einigkeit. Kern-/Energiedefizite setzen den Output aus.

`spontaneous_crystallization` und `dimensional_artificing` belegen reale Erlassproduktion in nativen Ressourcentabellen. Das ist bezahlte direkte Produktion, keine freien Technologien und keine Behauptung, dass reguläre Gebäude in Wilderness funktionieren. Forschungsbeschreibungen nennen die Alternative. S03 behält außerdem seinen echten Heilungsrabatt. Universelle Forschung hat damit konkrete Vorteile.

**Konkrete Grenze:** Die Wilderness-Alternative ersetzt weder sämtliche sieben Verbrauchergebäude noch deren planetare Skalierung. Sie ist auf 12/24 Grundkerne begrenzt und versorgt Forschung, lokale Entwicklungen und eine begrenzte konventionelle Eliteausrüstung. Sie trägt keine 200 voll ausgerüsteten konventionellen Schlachtschiffe. Bio-Schiffe erhalten keine kompatibilitätswidrig benannten EPOCH-Komponenten. Eine volle planetare Wilderness-Gebäude- oder Bio-Komponentenarchitektur ist hier ausdrücklich nicht implementiert. Native Erlasstabellen, Defizitaktualisierung und ihre Anzeige müssen im gebündelten Spieltest bestätigt werden.

## Persönliche Philosophie und lithoide Entwicklung

S13 und Wächterdoktrin verlangen `epoch_iv_philosophy_guard`; S14 und offene Protokollforschung verlangen `epoch_iv_philosophy_free`. Beide Erlasse sperren die andere Aktivierung. Ihre **laufenden** Modifier verlangen die passende und verbieten die gegenteilige Flag: Auch bereits aktive Erlasse eines alten Doppel-Erlass-Spielstands können keine widersprüchlichen Boni erzeugen. Unpassender laufender Unterhalt wird ebenfalls deaktiviert. Ein alter unpassender Erlass kann manuell abgeschaltet werden; die Storyflags werden niemals umgeschrieben. Paket C muss dieselben Flags für seine exklusive Perkwahl verwenden. Keine Vorabimplementierung der Perks.

S04/S07 bleiben für organische Individuen offen. Die bezahlten planetaren Entscheidungen wählen mit Vanillas `is_lithoid_empire` (Gründerspezies über `owner_species = { is_lithoid = yes }`) zwischen Nahrung und Mineralien: +10% bzw. +20%. Bewohnbarkeit und Gesellschaftsforschung bleiben erhalten. Fortentwicklung entfernt beide Vorstufenvarianten; doppelte oder schwächere parallele Projekte sind gesperrt. In gemischten Reichen richtet sich die Wahl bewusst nach der Gründerspezies, nicht nach einer behaupteten aktuellen planetaren Verbrauchsmehrheit.

## Statische Belastungsrechnung

Alle Werte kommen aus den ausführbaren Kosten-/Unterhalts- und Belegschaftstabellen in `test_stage_iv_b.cjs`. Volle Auslastung, keine Boni oder Rabatte, keine Flottenkosten oberhalb der Kapazität. Eine 100er-Belegschaft erzeugt weiterhin 2 Kerne gegen 12 Mineralien, 2 Legierungen und 6 Energie. Die Produktion je Belegschaft wird **nicht** billiger.

| Posten | Einmalige Kerne | Monatliche Kerne |
|---|---:|---:|
| Artillerie-Schlachtschiff: 1 X-Lanze, 4 L-Artillerien, 3 L-Endschilde, 3 L-Panzerungen, Reaktor, Computer, Antrieb, 2 Stabilisatoren | 325 | 0,634 |
| Ein vollständiger Endstufensatz der sieben Verbraucherfamilien, voll besetzt | 640 für Ausbauten (ohne lokale Entscheidungen) | 5,08 |
| Beispiel-Sternbasis: Reaktor, 6 M-Schilde, 6 M-Phasenwaffen | 165 | 0,26925 |
| Passende Doktrin | 100 | 3 |

Schlachtschiff: native 1X/4L-Artilleriesektionen, sechs große Defensiv- und zwei Hilfsslots; übrige native Pflichtkomponenten bleiben Vanilla. Das Basisdesign muss die tatsächliche Reaktorleistung im Designer bestehen. Die Sternbasis ist ein transparenter Ausstattungskorb, kein Beleg für einen frei zugänglichen Sternbasendesigner. Ihre autonomen Sektionen, tatsächliche Aufrüstung und Ausrüstungswahl bleiben native Testpunkte. Verteidigungsplattform- und Ionenkanonenreaktoren kosten zusätzlich 0,01 bzw. 0,02 Kerne monatlich je installiertem Reaktor; Waffen und Defensivteile kommen hinzu. Titan-/Juggernautreaktor: 0,042 / 0,143. Keine kernfreien Sternbasenreaktoren.

Die alte Grenze erzeugte maximal 6 × 4 = **24** Kerne. Schon 100 dieser Schlachtschiffe + ein Gebäudesatz + die Doktrin brauchen **71,48**, ohne Sternbasen. Die Grenze war keine tragfähige Skalierung für eine größere Qualitätsflotte.

Fabriken erhalten deshalb 300/600 statt 100/200 Jobkapazität: **6/12 Kerne** pro voll besetzter Fabrik. Baukosten 1.200/2.400 Mineralien und 225/450 Legierungen; Energieunterhalt 4/8. Stufe II braucht einschließlich Jobs monatlich **72 Mineralien, 12 Legierungen, 44 Energie**. Eine pro Kolonie über beide Stufen; keine feste Reichsobergrenze. Zusätzliche Produktion kostet Kolonien, Slots, Belegschaft und Inputs. Kernunterhalt der bestehenden Verbraucher bleibt unverändert.

| Szenario | Produktionsausbau | Verbrauch/Monat | Produktion | Saldo |
|---|---|---:|---:|---:|
| Klein: 20 Schlachtschiffe, 1 Gebäudesatz, 3 Beispielbasen, 1 Doktrin | 3 Fabriken II auf 3 Kolonien | 21,56775 | 36 | +14,43225 |
| Groß: 200 Schlachtschiffe, 4 Gebäudesätze, 20 Beispielbasen, 1 Doktrin | 14 Fabriken II auf mindestens 14 Kolonien | 155,505 | 168 | +12,495 |

Fabrikinputs klein: 216 Mineralien, 36 Legierungen, 132 Energie und 1.800 Jobkapazität; groß: 1.008 Mineralien, 168 Legierungen, 616 Energie und 8.400 Jobkapazität. Verbraucherinputs kommen hinzu. Diese Spezialisierung ist teuer und kein Flottenersatz ohne Wirtschaft.

**Reguläre Boni und Belastungen:** +25% Produktion aus der geerbten Spezialisten-/Jobkategorie ergibt 45 bzw. 210 Kerne (bei gleichen Grundinputs). +20% Kernunterhalt der Verbraucherjobs erhöht die Last um 0,696 pro Gebäudesatz, also auf 22,26375 bzw. 158,289. Eine isolierte -20%-Schiffsunterhaltsrechnung senkt den Flottenanteil um 2,536 bzw. 25,36; `ship_components` erbt nativ von `ships`. Die tatsächliche Kombination aller Boni bleibt eine Engine-Aufgabe. Bei halb besetzten Fabriken entstehen nur 18/84 Kerne und beide Szenarien laufen ins Defizit; bereits -25% Produktion lässt das große Beispiel mit 126 Kernen scheitern. Defizit: -15% Feuerleistung und -25% der erfassten EPOCH-Jobproduktion; Wilderness-Integration pausiert stattdessen direkt.

Das Lager von 15.000 deckt 20 Beispielschiffe (6.500 Kerne) und den Doktrinstart. 200 Schiffe kosten 65.000 Kerne und müssen über laufende Fertigung in Chargen ausgerüstet werden. Keine Behauptung einer sofort bezahlbaren 200er-Flotte. Paket C kann mit der Architekten-Schmiede und dem Nexus Baufläche/Belegschaft effizienter ersetzen oder ergänzen; Paket B benötigt diese zukünftigen Megastrukturen nicht zur Grundversorgung.

KI: Fabriken haben Gewicht 60 statt 10 und prüfen vor zusätzlichem Bau die vollständigen unmodifizierten Inputkosten (I: >36 Mineralien, >6 Legierungen, >22 Energie; II: >72/>12/>44). Verbrauchergebäude verlangen >3 monatliche Nettokerne, mehr als ihr individueller Grundunterhalt. Ausrüstung verlangt >0,25 Nettokerne und mindestens 100 Lagerkerne. Das vermeidet die Marktprüfung des Vanilla-Helfers für eine nicht handelbare Ressource. Reale KI-Planung, Bau- und Jobbesetzung bleiben unbewiesen.

## Waffen, Verteidigungsgebäude und Icons

Drei Rollen werden gezielt unterschieden; native Slots bleiben erhalten:

- Phasenbrecher M/L: Grundschaden zurück auf Vanilla-Plasma, zwei native Kettentreffer mit 18/40 Schaden und Sprungreichweite 15/20. Hauptreichweite 50/70, Schildschaden x0,15. Vorteil gegen dichte Formationen; isolierte Ziele und Schilde kontern die Waffe. L behält Mindestreichweite 45.
- Kausal-Lanze: Reichweite 175 und Mindestreichweite 60, Feuerzyklus 90 statt 70; unveränderter Schaden und kein Tracking. Weniger Dauerfeuerleistung, Lücke im Nahkampf. Reichweite ist der Vorteil.
- Fraktale Artillerie: Schildschaden x3, Panzerung x0,25, Hülle x0,75, Zyklus 60 statt 50. Schildbrecher mit explizitem Nachteil gegen Panzerung und Hülle. Reichweite, Mindestreichweite und fehlendes Tracking bleiben.

`000_documentation.txt` belegt `chain_damage`, `chain_count`, `chain_range`, `total_fire_time`, `windup` und `min_range`. Die übrigen Rollen erhalten keinen zusätzlichen Schaden. Native tatsächliche Feuerintervalle, Kettenzielwahl und DPS müssen im Spiel verglichen werden.

Akademie II: 24 Flottenkapazität, vier Einigkeit und acht Verteidigungsarmeen bei voller Belegschaft; zusätzlich +25% Armeerekrutierung. Dafür 0,8 Kerne/Monat, Energie und Legierungen. Vanillas Kriegerdrohne hat zunächst vier Flottenkapazität pro 100er-Belegschaft; native Forschung kann diese erhöhen. Der Mehrwert ist eine kombinierte Militär-/Einrichtung, keine Behauptung unbegrenzter Kapazitätsüberlegenheit. Phasengenerator II: stärkere Bombardementabwehr als der native 50%-Schild, sechs besetzte plus vier feste Verteidigungsarmeen für 0,5 Kerne monatlich; bei zusätzlichem Vanilla-Schild nur der Differenzbonus. Externe Caps bleiben offen.

36 Technologien nutzen nun passende vorhandene Assets mit mehr als 20 unterschiedlichen Symbolen; alle Pfade werden gegen die Installation geprüft. Die acht Gebäudefamilien besaßen bereits acht unterschiedliche gültige Symbole (Labor, Schmelze, Energienetz, Institut, Monument, Planetarschild, Nanitentransmuter, Festung); diese erkennbaren Familien bleiben erhalten. Keine unnötigen neuen Grafikdateien. Generierte Float-Ausgaben sind auf sechs Nachkommastellen begrenzt.

## Regression und genau ein gebündelter Ingame-Test

Befehl: `pwsh -NoProfile -File scripts/test_epoch_regressions.ps1`. Vollständige Ausgabe: [Review-Prüfprotokoll](../research/stage-iv-b-review-static-checks-2026-11-10.txt). Zusätzliche Primärquellen und SHA-256 stehen im [Quellenmanifest](../research/stage-iv-b-sources.json). Bestehende Stages I–IV-A einschließlich Heilungskosten-/Callback-/Storyschutz bleiben geprüft. Alte Spiel-Logs werden ausdrücklich als vor diesem Fix entstanden ausgewiesen.

**Noch auszuführen: genau ein gemeinsamer Paket-B-Abnahmelauf**, mit den folgenden Kontrollreichen im selben Lauf, keine 42 Einzeltechnologie-Tests:

1. Authentisch abgeschlossener Kontrollstand mit konventionellem organischem/lithoidem Reich; persönliche Schlüssel und Philosophie unverändert lassen. Repräsentative frühe, mittlere und letzte Infrastruktur erforschen. Preis und Heilungsrabatt vor/nach S03 vergleichen. Passende Doktrin aktivieren, Gegenphilosophie ausgeschlossen; alten Doppel-Erlass-Stand bei Bedarf im selben Lauf laden.
2. Fabrik I ohne Kernbestand bauen und besetzen, II ausbauen, zweite Fabrik derselben Kolonie sperren; weitere Kolonie erschließen. Monatliche Brutto-/Nettoerträge, Inputs und Jobskalierung messen. Je ein Forschungs-, Schmelz- und Verteidigungsgebäude samt Upgrade prüfen; lithoide Entscheidung und Ersatz der Vorstufe prüfen.
3. Ein Artillerie-/Trägerschiff mit EPOCH-Reaktor, Schild, Panzerung und Rollencomputer ausrüsten. X/L/M/G/H/P/T-Slotangebote stichprobenartig prüfen; drei geänderte Rollen gegen Vanilla und Gegenmaßnahmen beobachten. Designerleistung, Feuerzyklen und Sternbasen-/Plattform-Aufrüstung prüfen.
4. Wilderness- und Bio-Schiffs-Kontrollreich im selben Lauf: universelle Forschung erreichbar, unbrauchbare Gebäude bzw. elf Hardware-Karten verborgen; Fertigung ohne Jobs einschalten, Kerne ansparen, Integration und passende Doktrin aktivieren. Reale Ressourcentabellen und einen Inputmangel prüfen. Keine Konsolenflags als Nachweis eines verdienten Storyabschlusses.
5. Einen bewussten Kernengpass bis zum echten Defizit erzeugen, Wirkung und Erholung messen. KI-Produktion vor neuen Verbrauchern beobachten; speichern/laden, private Freigabe eines zweiten Reiches kontrollieren. Multiplayer bleibt bis zu einem echten Host-/Client-Test separat offen.
