# D2: gezielte statische Nachprüfung, 2026-11-11

Basis: aktueller, abgerufener `origin/main`, `9dee039ff196e51e38ea743eb46ab5f85cbb7c72`; installierte Vanilla 4.5.3 unter `G:/Steam/steamapps/common/Stellaris`. Kein Spielstart, Save-Eingriff oder zusätzlicher Testmod. Alle Gameplay-, Produktions-, Text- und UI-Dateien bleiben identisch zu dieser Basis. D2 korrigiert einen nachweislich falschen D1-Befund und ergänzt Tests; es behauptet keinen reparierten Enginefehler.

## Skalierung: Befund widerlegt

`epoch_iii_update_strength` enthält tatsächlich:

```text
limit = { OR = { is_difficulty = 5 is_difficulty = 6 } years_passed >= 100 }
```

Damit gilt `(Schwierigkeit 5 ODER 6) UND Jahr >= 100`. Die im Auftrag zitierte Variante mit der Jahresbedingung innerhalb des OR steht nicht auf main. `else_if` ist für Schwierigkeit 0–4 ab Jahr 100 erreichbar. Vorher gilt für alle Schwierigkeiten die Grundstufe. Das ist ausdrücklich die Absicht in `docs/phases/stage-iii-second-playtest.md`, Tabelle „Militärische Balance“ und Satz „Bei früherem Midgame bleibt die kleinere Grundstufe bestehen“, sowie `stage-iii-third-playtest.md`, Staffelungstabelle. Hohe Schwierigkeit bereits vor Jahr 100 hart einzustufen wäre eine neue Balanceänderung, keine Wiederherstellung. Die bedingte Korrektur aus dem Auftrag entfällt deshalb.

Erweiterte bestehende Stage-III-Tests interpretieren die echten Skriptbedingungen für alle sieben Schwierigkeiten bei Jahr 0/50/99/100/101/150, jeweils mit exakt einem resultierenden Modifier und 24 Wiederholungen. Zusätzliche Übergänge starten mit jedem der drei gültigen gespeicherten Modifier, überschreiten Jahr 100 und wechseln zwischen hoher/niedriger Schwierigkeit. Die unabhängige Wrackabschwächung bleibt erhalten. Bestehende Modifierwerte, IDs, Ersetzungslogik und Save-Verträge bleiben unverändert. Das beweist Skriptverzweigung und Zustandsübergänge im Modell, keine Kampfschwierigkeit oder Engine-Saveausführung.

## Richter-KI: konkreter Restbefund, keine Änderung

- `epoch_iv.82`: genau eine zufällige eigene Militärflotte, nicht im Kampf, Stärke strikt über 30.000 und Zugang zur persönlichen Arena. Keine Summierung, gegnerische Stärke oder Reparaturbereitschaft. Das permanente `epoch_iv_ai_attack_ordered` wird erst innerhalb einer erfolgreichen Auswahl gesetzt, zusammen mit der reichsgebundenen Flottenreferenz und `auto_follow_fleet` gegen den persönlichen Richter.
- Monatlich wird Kapitel V zunächst an `.82` weitergereicht; erst danach wird das Signal bei fehlender eigener Flottenreferenz entfernt. Nach vollständigem Verlust ermöglicht das somit erst der nächste Monatspuls erneut einen Auftrag. Bei überlebender Flottenreferenz bleibt das Signal gesetzt, auch wenn eine Niederlage/Flucht stattgefunden hat. Das sperrt nachweislich weitere explizite `.82`-Aufträge; es beweist keinen Stillstand der normalen Flotten-KI.
- `epoch_iv_restore_judge` entfernt Signal und gespeicherte eigene Flottenreferenz. Die `.57/.58`-Rückzugssequenz betrifft ausschließlich Richtereskorten und löscht diese nach 120 Tagen. Sie ist kein Rückzugshandler für die ausgewählte Reichsflotte. Die bestehenden Kampfhooks behandeln Eintritt/Schiffstod und persönliche Sieganrechnung, keinen bestätigten Rückkehrzustand der Reichsflotte.
- Native Belege: `common/on_actions/00_on_actions.txt`, `on_entering_battle`, sowie generierte `logs/script_documentation/effects.log`, `auto_follow_fleet`, und `triggers.log`, `has_fleet_order`/`is_in_combat`. Die Effektbeschreibung bestätigt nur Folgen und möglichen Angriff. Sie definiert weder Fortbestand nach Notrückzug noch eine eindeutige Zuordnung zu `follow_order`. Bloß „nicht im Kampf“ trifft auch die Anreise; ein pauschales Rücksetzen könnte laufende Aufträge überschreiben. Ein Timeout oder Reset beim Kampfeintritt würde neue Wiederholungs-/Parallelangriffsregeln einführen. Ohne diese Enginebelege bleibt der lokale Fix unbestätigt und unterbleibt gemäß Auftrag.

## Protokollkerne: Rechnung bestätigt, Risiken unverändert

Quelle sind die echten Ressourcentabellen, nicht Tooltips. `scripts/test_stage_iv_d2.cjs` prüft die festen D1-Referenzzahlen zusätzlich zum bestehenden Tabellenrechner. Die bestehenden Produktionsprüfungen vergleichen native unbedingte Jobproduktion mit `02_specialist_jobs.txt`/`04_gestalt_jobs.txt` und den nativen Input-Defizitsituationen; daraus folgt keine sofortige Produktionssperre bei leerem Lager.

| Szenario | Produktion | Verbrauch | Netto | Netto bei halber Fabrikbesetzung |
|---|---:|---:|---:|---:|
| Klein | 36 | 27,66775 | 8,33225 | −9,66775 |
| Mittel | 144 | 121,834 | 22,166 | −49,834 |
| Groß | 288 | 241,745 | 46,255 | −97,745 |

Fabrik I/II: 36/72 Kerne, 54/108 Mineralien, 9/18 Legierungen, 28/56 Energie bei Vollbesetzung. Früher Einstieg: 36 − 2,18 = 33,82 Kerne. Eine Fabrik II im großen Szenario: −169,745. Referenzschiff: 0,634; Sternbasis: 0,26925; Gebäudesätze: 11,18/26,64; Philosophieedikt: 3 Kerne monatlich. Zusätzliche 100 Referenzschiffe kosten allein 63,4 Kerne/Monat, ohne gewöhnlichen Schiffsunterhalt und Baukosten.

Wilderness klein/mittel/groß: 2/4/6 Knoten, 72/288/432 Produktion, 19,48775/71,554/138,185 Verbrauch, netto 52,51225/216,446/293,815. Inputs Mineralien/Legierungen/Energie: 216/36/112, 864/144/448, 1296/216/672. Keine Fabrikjobs; nur erforschte Produktionstiers zählen. Keine Aussage über Klassengleichgewicht.

Megastrukturgruppen Einstieg/Endstufe: 24/72 Produktion und 12/46 Kernunterhalt, dazu 200/700 Energie und 400/1200 Mineralien. Aufwertungen ersetzen Vorgänger. Groß plus Endstufen: 72,255 netto, bei halber Fabrikbesetzung −71,745. Baukosten werden zusätzlich aus Reserven bezahlt; exklusive UAP-Ausgabezweige erzeugen keine Kerne.

Bewusst nicht verändert:

- Baupriorität Fabriken 60 gegenüber Verbrauchern 10, gleicher Koeffizient 0,1. Das sind Gewichte, keine garantierte Reihenfolge. Fabrik-I-KI verlangt Mineralieneinkommen >54, Energie >28 und Legierungen >9; II >108/>56/>18. Keine Kernkosten zum Bootstrap. Die II-Schranken prüfen volle neue Last statt nur Differenz zur I; konservativ, kein bewiesener Logikfehler.
- Verbraucher verlangen typischerweise Kerneinkommen >3 und Energie >10, unabhängig von ihrer gesamten späteren Joblast. Entscheidungen konkurrieren bei gleichem Gewicht und eigener Einkommensprüfung. Komponenten prüfen >0,25 Kerneinkommen und mindestens 100 Kerne Vorrat. Keine dieser lokalen Schranken reserviert ein reichsweites Flotten-/Baubudget. Keine pauschalen Gewichtserhöhungen oder Produktionsboni.
- Jobzugang entspricht Spezialisten-/Drohnenbedingungen und allgemeinen Gewichtskonstanten. Das gewährt Stellen, keine besetzten Jobs; Umschichtung, andere Jobs und Modifikatoren bleiben Engineverhalten. Keine statisch belegte falsche Jobklasse gefunden.
- Wilderness-Netz aktiviert mit festen Einkommensschranken >144 Mineralien, >24 Legierungen, >96 Energie; diese skalieren nicht mit Knoten/zweitem Tier und werden bei aktivem Edikt übersprungen. Bereits klein sind tatsächliche Inputs höher. Ausbau durch Kolonien/Forschung kann also zusätzliche Last erzeugen. Das ist eine unzureichende Vorsorge, aber kein Beleg für falsche Produktion; dynamische Aktivierungs-/Abschaltregeln würden die Mechanik ändern.
- Megabaugewichte prüfen laufende Inputs pro Zielstufe (Nexus Kerne >2/4/6, UAP >10/20/30/40; Forge Energie/Mineralien passend zur Zielstufe). Vorhandene Inputs, Baukosten, Parallelbau, Besitzerfreigaben und tatsächliche Upgradeauswahl bleiben relevant. Die bekannten Scope-Diagnosen werden nicht neu repariert oder als gelöst bezeichnet.
- Forschungs-/Designerwahl, Refits, Wiederholungsangriff nach Flucht, Mehrspieler-Isolation, reale Kampfstärke und der starke späte Forschungs-/Flottenbonus-Stapel bleiben unbestätigte Spielrisiken.

## Abnahme

Gezielte Tests: Stage III **2349** Assertions; D2 **271** Prüfungen. `powershell -ExecutionPolicy Bypass -File scripts/test_epoch_regressions.ps1`: **PASS, 717 aggregierte Prüfungen**, einschließlich aller bestehenden Stage-I–IV-, Parser-, Vanilla-, Produktions-, Icon-, Laufzeitvertragsmodell- und D1-Suiten. D1: **17104** Assertions im Arbeitsstand vor Aufnahme der neuen Dateien; die zusätzliche Dateiumfangsprüfung zählt nach Aufnahme zwei weitere Dateien. `git diff --check`: **PASS**. Die Auswertung vorhandener Logs meldet 18 EPOCH-bezogene und 74037 fremde/Vanilla-Zeilen; das sind bestehende Logs, kein D2-Lauf und kein Nachweis ihrer Behebung.

Kein neues Ingame-Gate: Alle ausführbaren Spieldateien und Lokalisationen bleiben identisch, ausdrücklich maschinell gegen die main-Basis geprüft. Somit sind diese Befundkorrektur und statischen Tests ohne erneuten Ingame-Test vertretbar. Die unveränderten KI-Risiken erhalten dadurch keine Engineabnahme.
