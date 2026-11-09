# Stage III: Abschlusskorrekturen nach dem dritten Spielertest

Stand: 2026-11-09. Ausgangspunkt: `9568800e200382457a6d6f3266a4c284a7d5b36f`, PR #15. Der Spieler meldet den dritten zusammenhängenden Ingame-Test als erfolgreich: Mechaniken, sichtbare Stationen, globale Kapitel, Kommunikation und militärischer Abschluss funktionieren. Diese Meldung ersetzt den offenen Abnahmestand des zweiten Tests. Die folgenden kleinen Änderungen wurden statisch geprüft; eine erneute vollständige Spielerabnahme ist kein Merge-Gate.

## Änderungen

- Kapitel V wird weiterhin sofort global gesetzt und für alle Beteiligten synchronisiert. Ist das Kommandoschiff beim letzten erforderlichen Militärergebnis bereits zerstört, entfällt ausschließlich `epoch_iii.52`; der bestehende Validator sendet sofort `epoch_iii.12`. Frühere Kapitel-V-Meldungen bleiben möglich. Ein gespeicherter Empfänger-Guard und erneute Prüfung beim Ereignis verhindern Wiederholungen bzw. überholte Meldungen. Es gibt keine neue Wartezeit.
- Interplanetare Übertragung verwendet die vorhandene Koordination und native gespeicherte Zeitflags: erste Gelegenheit nach 360 Tagen, dann frühestens alle 360 Tage, höchstens drei Gelegenheiten je Reich. Zusätzliche Kampfaufrufe verkürzen die Abstände nicht. Je Gelegenheit gibt es höchstens einen 25%-Versuch; die Gelegenheit wird vor dem Wurf verbraucht. Ohne aktive Krise oder kanonischen Narbenanker erfolgt kein Versuch.
- Nur unbehandelte, exponierte Welten mit aktiver III-Störung dienen als Quelle. Eindämmung, Signalpufferung und Stabilisierung stoppen die Weitergabe. Übertragene Welten sind dauerhaft als Quellen ausgeschlossen, auch nach Eroberung. Geeignete Ziele sind saubere Kolonien desselben Besitzers. Alte Featurezustände, auch geheilte/abgeschlossene Zustände und ihre Flags, aktive alte Kampagnen und gespeicherte Ziele bleiben geschützt.
- Die lebenslange Obergrenze zusätzlicher Übertragungswelten beträgt 1 bei weniger als 8 Kolonien, 2 ab 8 und 3 ab 20. Behandlung und Besitzwechsel erstatten keine Ausgaben oder Versuche. Vorhandene Direktangriffe und deren Grenzen bleiben bestehen. Neue Schäden verwenden die vorhandene III-Narbenbelastung und aktive Kontamination; sie sind mit bestehenden Entscheidungen behandelbar. Die Ankerzerstörung heilt keine Schäden. Es gibt keine zusätzlichen Pflichtfenster.
- DE/EN-Optionen, Situationsziele, POIs, Projekt- und Entscheidungsbeschreibungen wurden auf unmittelbare Wirkung oder kurze Ziele gekürzt. Reine Bestätigungen enthalten keine Zusatztooltips. Kosten, Modifier und Probenwahrscheinlichkeiten verwenden native Vorschauen. Die Pufferungsanforderung zeigt einen lokalisierten Satz statt interner Flags. Ereignisgeschichten und Stage-I/II-Inhalte bleiben erhalten.
- Die bestehenden exklusiven militärischen Stufen erhöhen ausschließlich ihren Waffenschaden. Flottenzahlen, Hülle, Feuerrate, Verstärkungsbudgets, Kapitel- und Siegbedingungen bleiben unverändert.

| Stufe | Vorher | Jetzt | Wirksamer Mehrschaden | Mit -20% Wrackabzug |
|---|---:|---:|---:|---:|
| Früh | +15% | +29% | 12,17% | 14,74% |
| Ab 100 Jahren | +25% | +40% | 12,00% | 14,29% |
| Ab 100 Jahren, hohe Schwierigkeit | +35% | +51% | 11,85% | 13,91% |

Diese Änderung wirkt auf mobile Angriffsverbände, Kommando/ Eskorte und Verteidiger über dieselbe vorhandene Stufenzuweisung; es kommt kein zweiter Multiplikator hinzu. Die Angaben sind berechneter Waffenschaden, keine gemessene Flottenstärke oder Gefechtssimulation.

## Nachgewiesene Scriptfehler

Beide `create_species`-Pfade (Ersterzeugung und Referenzreparatur) erhalten `namelist = MACHINE1`, weiterhin `class = ROBOT`, `portrait = default_robot`, `trait_machine_unit`. Die installierte 4.5.3-Vanilla verwendet dieselbe explizite ROBOT/Namenslisten-Zuordnung in `events/ancient_relics_arcsite_events_2.txt:8809`; `common/name_lists/MACHINE1.txt` existiert. Die erzeugte Scriptdokumentation beschreibt `namelist` innerhalb von `create_species`. Die separate `name_list`-Angabe an `create_country` ersetzt diese Species-Angabe nicht. Es entsteht kein weiteres Krisenreich.

`epoch_iii.70` setzt keine Flottenhaltung mehr. Die generische Effektliste nennt `evasive`, garantiert aber keine Unterstützung durch militärische Flotten; der gemeldete Laufzeitfehler belegt die Inkompatibilität des betroffenen Verbandes. Das Entfernen vermeidet Haltungsannahmen für mobile und stationäre Überlebende. Cleanup-Markierung, gelöschte Angriffsaufträge, Aggrobereich 0, erreichbarer nativer Rückzugsauftrag ausschließlich für mobile Verbände und Löschung nach 120 Tagen bleiben erhalten. Die Verlusthooks lehnen Cleanup und alle Aufrufe nach Krisenende weiterhin ab.

## Prüfungen und verbleibende Risiken

Die vorhandene vollständige Regression und gezielte Ergänzungen in `scripts/test_stage_iii.cjs` prüfen die tatsächlichen geparsten Scripts: gleichzeitiges Kapitel V/Sieg bei 2/3/4 Fronten, Wiederholungen, frühere Kapitelmeldung, begrenzte Übertragung, native Abklingzeit trotz Kampfaufrufen, Schutz sämtlicher alter Features/Flags/Ziele, Eindämmung, Quellenverlust, native Vorschauen und DE/EN-Kürze, Namensliste, Rückzugsbefehle und begrenzte effektive Schadenserhöhung. Der vollständige Output steht im [statischen Bericht](../research/stage-iii-third-playtest-static-checks-2026-11-09.txt). Wiederhergestellte Testobjekte belegen Guards, keine echte Engine-Save/Load-Ausführung.

Die vom Auftrag genannten `game(10).log`/`error(10).log` lagen diesem Chat nicht als separate Dateien vor. Ihre beiden Fehlermeldungen und die Doppelauslösung stammen aus dem Spielerbericht. Das lokal vorhandene `error.log` wird vom bestehenden Regressionslauf nur als vorbestehender Logstand klassifiziert; es ist kein Lauf mit diesen Korrekturen.

Verbleibend sind begrenzte Laufzeitrisiken der neuen seltenen Übertragung, Tooltip-Darstellung und moderaten Balanceänderung; diese Änderungen wurden nicht erneut im Spiel ausgeführt. Native Zeitflag-Serialisierung, KI und Multiplayer sind durch statische Tests nicht abschließend belegt. Der erfolgreiche dritte Spielertest wird nicht als Ausführung der nachträglichen Korrekturen ausgegeben. Nach bestandenen Regressionen ist PR #15 für den angeforderten Umfang mergebereit; kein weiterer vollständiger Ingame-Test wird verlangt und der PR wird nicht automatisch gemergt.
