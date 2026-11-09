# Stage III: Änderungen nach dem zweiten Ingame-Test

Stand: 2026-11-09. Branch `feature/stage-iii-convergence`, PR #15, Ausgangspunkt `2c95edfc781cce3e76e6eb73f8dfd6dd069af63e`. Ziel bleibt Stellaris 4.5.3 (4e91). Dieser Bericht ersetzt ältere Anforderungen an eine vollständige Restflottenjagd sowie frühere Beschränkungen auf den Krisenauftakt. Stage I/II behalten ihre ausführbaren Definitionen unverändert; ihre Lokalisierung erhält ausschließlich kompatible Interpunktion.

## Konkrete Spielerbefunde

- Die fünf Kapitel projizieren weiterhin ausschließlich den gespeicherten Kapitelstand des kanonischen Krisenreichs. Die Symbole sind jetzt die fünf verschiedenen installierten Schweregradgrafiken `GFX_situation_stage_1` bis `_5`.
- Eine native Event Chain ohne Zähler trägt bis zu vier POIs. Feste IDs verhindern Duplikate. Anfangs erscheinen unbekannte Konstruktionen, nach echten Gefechtsverlusten ihre Funktionen. Zerstörte Anker verlieren die Markierung; nach dem letzten Anker endet auch die leere Chain. Ein fehlender Eintrag wird aus den lebenden Standorten wieder aufgebaut. Der Chain-Empfänger ist ausdrücklich das gerade bearbeitete Reich (`this`), auch bei Aufruf aus dem globalen Koordinator.
- Kommandoschiff und Restflotten erzeugen keine eigenen Logeinträge mehr. Die alte Situationsdefinition bleibt nur als sofort abbrechende Kompatibilitätshülle für vorhandene Saves erhalten.
- Kapitel IV nutzt beim Erscheinen des Kommandoschiffs erneut ein diplomatisches Event mit demselben Robotporträt und Raum wie der Krisenbeginn. Ein gespeichertes Länderflag verhindert Wiederholung; später eingeschriebene Reiche erhalten die Übertragung einmal. Die Botschaft eskaliert ein unbekanntes Verwahrungsprotokoll und bietet keine Verhandlung.
- DE/EN-Berichte erzählen Beobachtungen und Reaktionen, mit eigenen Stimmen für organische Reiche, Schwärme und Maschinen. Zahlen, Forschung und militärische Ziele stehen in Optionstooltips. Die Architekten bleiben unerwähnt.

## Stationsbefund und Änderung

Der vorhandene Spielstand `autosave_2271.01.01.sav` enthält in militärischen Aufklärungsdaten den Frontverband mit **einer großen und zwei kleinen AI-Militärstationen**, 3251,53906 Flottenstärke und Systemursprung 132. Damit ist eine vollständig fehlende Erzeugung für diesen beobachteten Standort widerlegt. Der Save enthält bereits die echten Ankerverlustflags; ein noch lebendes Objekt lässt sich daraus nicht für eine neue Sichtprüfung rekonstruieren. Die Aufklärungsdaten sind kein Bildschirmbeweis.

Installierte Quellen bestätigen die unbeweglichen bewaffneten Rümpfe, ihre `shipclass_military_station`, die richtigen `ai_01`-Modelle und den nativen Fabrikansatz des Grauen Sturms. Neu wird jede Unterstützungsstation in einer eigenen Flotte an einer anderen Position um den physischen Systemstern aufgestellt. Die Bastion bleibt das kanonische Ankerziel; zwei kleine Stellungen sind zusätzliche Verteidigung. Dadurch stehen nicht mehr drei unbewegliche Schiffe in derselben Flotte. Bestehende Ankerflotten und ihr bereits ausgegebenes Nachschubbudget werden beim Laden nicht ersetzt oder erneut erzeugt.

Das alte Fehlerlog enthält außerdem ungültige `solar_system`-Abfragen bewegter Vorhutflotten und daraus folgende ungültige Zielmarkierungen. Bewegungsplanung und finale Sammlung werden nun ohne aktuellen Systemscope übersprungen. Nicht vorhandene gespeicherte Bewegungsziele werden nicht mehr ungeprüft gelöscht. Die Übertragung gezielter militärischer Aufklärung bleibt erhalten; es gibt keine pauschale galaktische Sensoraufdeckung.

**Offene Laufzeitfrage:** Die genaue Ursache des vom Spieler beobachteten unsichtbaren Stationsmodells ist damit noch nicht abschließend bewiesen. Getrennte Aufstellung und physische Sternreferenzen sind implementierte Korrekturen, keine behauptete Sichtprüfung. Der lokale Mod wurde für einen Test aktualisiert; der anschließende Spielstart über Computer Use scheiterte mit `Computer Use app approval timed out`. Es wurden keine neuen Spielszenen beobachtet und keine Saves verändert. Quellfingerabdrücke stehen im [Manifest](../research/stage-iii-second-playtest-source-manifest-2026-11-09.json).

## Militärische Balance

| Parameter | Neuer Wert |
|---|---|
| Mobile Garnison pro Front | 18 statt 14 Vollstrecker |
| Eskorte des einzigartigen Kommandoschiffs | 36 statt 24 Vollstrecker |
| Frühe Formationen, alle Schwierigkeiten | +15% Waffenschaden, +20% Hülle |
| Ab 100 vergangenen Jahren | +25% Waffenschaden, +35% Hülle |
| Ab 100 Jahren auf Admiral/Großadmiral | +35% Waffenschaden, +50% Hülle |
| Kanonische Anker, zusätzlich | +75% Hülle, +35% Panzerung |

Die Stufen ersetzen sich und werden nicht jeden Monat neu aufgetragen. Bei früherem Midgame bleibt die kleinere Grundstufe bestehen. Galaxiegröße beeinflusst weiter 2–4 Fronten; der vorhandene Krisenstärkemultiplikator ab 2 und spätere Jahre verstärken weiter die Angriffswellen. Die Grenzen von zwölf mobilen Angriffsverbänden, sechs lebenslangen Einsätzen je Quelle und 540 Tagen Quellabklingzeit bleiben bestehen. Es gibt keinen unbeschränkten Multiplikator für extreme Einstellungen.

Quellzerstörung, Schildunterstützung, Signalrelais, gesicherte Wrackforschung und das gezielte Verstärken bedrohter Anker durch den Kommandanten bleiben relevant. Die zweite gesicherte Untersuchung ersetzt die erste Waffenabschwächung und schwächt zusätzlich Schilde. Diese Werte sind eine begrenzte Verstärkung nach dem Spielerfeedback; tatsächliche Schwierigkeit und Flottenstärke sind noch nicht neu im Spiel gemessen.

## Planetare Verknüpfung

Solange der Kontaminationsanker aktiv ist, verschlimmert sich die zusätzliche Belastung bereits exponierter Welten nach zwölf und nochmals nach 24 ungehemmten Monatsimpulsen. Stufe 1 kostet zusätzlich 3% Arbeitsplatzproduktion und 2 Stabilität, Stufe 2 ersetzt dies durch 6% und 4 Stabilität. Es gibt keine weiteren Stufen und keine planetengetriebene Ansteckung. Die vorhandenen größenabhängigen Grenzen initialer und späterer exponierter Welten bleiben erhalten.

| Entscheidung | Kosten / Dauer | Ergebnis |
|---|---|---|
| Eindämmen | 150 Energie, 100 Mineralien / 60 Tage | Stoppt weitere örtliche Verschlimmerung; 2% lokale Produktion für Isolation |
| Untersuchen | 250 Energie / 120 Tage, einmal je Welt | 400 Physikforschung; bei Eindämmung sicher zwei Jahre +5% Physikforschungstempo. Ohne Eindämmung 70% Erkenntnis, 30% Unfall mit 10 Verwüstung und maximaler zusätzlicher Eskalation |
| Stabilisieren | 400 Energie, 300 Mineralien, 100 Legierungen / 180 Tage | Entfernt Eskalations- und Eindämmungsabzüge; puffert III-Grundstörung auf -1 Stabilität/-1% Produktion. Nur eine von III eingeführte, weiterhin unberührte aktive Kontamination wird eingedämmt |

Die Auswirkungen verwenden breite Arbeitsplatzproduktion und Stabilität statt unpassender Nahrungskosten für Maschinen. Es entstehen keine wiederholten kostenlosen Forschungsbelohnungen bei Eroberung. Eindämmung, Pufferung und Behandlung stoppen weitere Stufen; die Ankerzerstörung stoppt zusätzlich neue Schläge. Keine dieser Aktionen erfüllt militärische Ziele.

Alte Contained/Controlled/Studied/Healed-Zustände werden nicht zurückgesetzt. Die neuen Abzüge sind separate III-Modifier; alte Setter werden nicht aufgerufen. Eine bereits aktive alte Kampagne oder ein gespeichertes altes Ziel verhindert auch die gezielte Featurebehandlung. Ältere Schäden, Verwüstung und Forschungsereignisketten bleiben bestehen. Nach dem Sieg endet die Verschlimmerung, nicht der Schaden. Behandlung und Pufferung bleiben möglich; Pufferung erfordert dann kein sinnlos gewordenes Militärprojekt mehr.

## Militärisches Ende und Bereinigung

Ein gemeinsamer Validator verlangt echte Kampfverlustflags für sämtliche registrierten Anker und für das einzigartige Kommandoschiff. Die bestehenden Verlusthooks verlangen weiterhin Opfer, gegnerisches Reich und verursachenden Kampfverband; Scriptlöschung und fehlende Referenzen zählen nicht. Alle drei Berichtsausgänge verwenden dieselbe Prüfung. Das Kapitel-V-Milestone wird bei bereits vernichteten Ankern und kämpfendem oder zerstörtem Kommandoschiff erreicht; Forschung verändert keinen Kapitelstand.

Kleinere Verbände, Garnisonen und deren Abschusszähler blockieren den Sieg nicht mehr. Die Prüfung läuft vor neuen monatlichen Quelloperationen. Bei Erfolg wird zuerst die Krise inaktiv und terminal gesetzt. Überlebende mobile Verbände werden markiert, erhalten evasive Haltung, Aggro-Reichweite null und, soweit erreichbar, einen nativen Bewegungsbefehl zum ehemaligen ersten Frontstandort. Stationäre Unterstützungen erhalten keine mobile Haltung oder Bewegung.

Nach **120 Tagen** entfernt ein nur nach dem echten Sieg zulässiges Flottenevent die markierten Überlebenden ohne Todesgrafik. Das ist der bewusst begrenzte Abschlussmechanismus für blockierte, kämpfende oder nicht mehr erreichbare Verbände; es ist kein behaupteter vollständig nativer FTL-Abzug. Bis dahin ist eine Rückbewegung möglich, aber ihre Ausführung ist nicht neu beobachtet. Kein Überlebender wird als Abschuss gewertet. Neue Angriffe, Verstärkungen und militärische Bonusforschung sind ab dem terminalen Zustand gesperrt. Saves halten die verzögerten Flottenereignisse; der monatliche Koordinator kann unmarkierte Überlebende eines bereits terminalen Saves nachtragen.

Abgebrochen werden `EPOCH_III_PREPARE`, `EPOCH_III_COUNTERHARMONICS` und `EPOCH_III_SITE_1` bis `_4`. Der Gegenharmonikprojekt-Abbruch prüft zusätzlich den aktiven Krisenzustand. Abgeschlossene Erkenntnisflags bleiben erhalten; Gegenharmonik-Kampfbonus, Dekodierung und Notmobilisierung werden entfernt. Hauptsituation, alte Marker und POI-Chain werden bereinigt. Auch verspätete Forschungs-/Kampfcallbacks prüfen den aktiven Zustand. Sinnvolle allgemeine Veteranenerfahrung und zeitbegrenzte planetare Probenerkenntnis bleiben bestehen.

## Prüfung und nächste zusammenhängende Abnahme

Der [vollständige statische Lauf](../research/stage-iii-second-playtest-static-checks-2026-11-09.txt) enthält die bestehenden Regressionen und die gezielten neuen Assertions. Diese prüfen unter anderem das Ende trotz Überlebender, die weiterhin notwendigen echten Hauptzielverluste, POI-Idempotenz und Wiederherstellung, fünf gültige Symbole, Eskalationsgrenzen, Quellenstilllegung, Klassenvergleich, begrenzte Stärke, Projektbereinigung und alle DE-/EN-BOMs und bekannten problematischen Satzzeichen. Normale ASCII-Apostrophe und deutsche Buchstaben bleiben erhalten. Die alten ausführbaren Stage-I/II-Dateien werden weiterhin gegen den Git-Baseline verglichen; nur Interpunktion wird für Lokalisierungsvergleiche normalisiert.

Ergebnis: **708** Prüfungen des vollständigen Regressionsskripts bestanden; enthaltene Teilläufe melden **5.287** Kampagnenzustands-, **1.176** Resonanz-, **33** installierte Quellen-, **2.405** Narrativ/UI- und **1.390** Stage-III-Assertions. Der Clausewitz-Parser prüft **39** Dateien. Auch der Selbsttest der Laufzeitlog-Klassifizierung besteht. Diese Zahlen sind getrennte Testberichte und werden nicht als unabhängige Gesamtsumme addiert.

Die nächste Spielerabnahme bleibt ein zusammenhängender Ablauf: vor dem Midgame beginnen; unbekannte Anker und **physische** getrennte Stationen ohne globale Sensorhilfe prüfen; militärische Erkenntnis und Kapitel III verfolgen; eine Welt vernachlässigen, eine eindämmen/untersuchen und später behandeln; den Kontaminationsanker zerstören und das Ende weiterer Stufen beobachten; die einmalige zweite diplomatische Übertragung und den stärkeren Kommandanten erleben; mit absichtlich lebenden Kleinverbänden den letzten echten Hauptzielverlust erreichen; Sieg, Rückbewegung/120-Tage-Abschluss und vollständige militärische Logbereinigung beobachten. Gemeinsame Speicherpunkte dienen den direkten, wissenschaftlich gestützten und gemeinsamen militärischen Varianten. Keine Einzelabnahme kleiner Fixes und keine Wiederholung bereits bestätigter Grundmachbarkeit.

Noch offen sind die tatsächliche Modell- und Glyphendarstellung, das Verhalten unter Sensornebel, reale planetare Wirtschaftsdeltas, Rückzug aus laufenden Gefechten, native Ereignispersistenz beim Laden und Host-/Client-Synchronisierung. Kein neuer Laufzeit- oder Multiplayer-Pass wird behauptet. PR #15 bleibt offen und wird nicht gemergt.
