# Stage IV - Paket B: Neue Technologieära

Stand: 10.11.2026. Implementiert auf dem aktuellen main nach PR #17 (`e9aa03d3f59e12ab15b9aa94c6a07c90b1b59318`). **Statische Prüfung bestanden; keine Ingame-Abnahme behauptet.** Grundlage bleiben [Entwurf](stage-iv-ascension.md) und [Arbeitspakete](stage-iv-work-packages.md). Kein Submod, keine Vanilla-GUI-/Define-/CSV-Overrides, keine Gigastructures-Abhängigkeit. Paket C bleibt offen.

## Forschung und persönliche Freigabe

Es gibt genau 42 reguläre Technologien: je 14 Physik, Gesellschaft und Ingenieurwesen. Die sechs Prototypen aus A bleiben erhalten. Alle 36 Ergänzungen prüfen `epoch_iv_future_research`: eigene private Berechtigung, eigener Protokollschlüssel **und** eigener Abschluss. Zusätzlich unterdrückt ein Forschungsgewicht von null gesperrte Karten; Reverse Engineering ist für die Ergänzungen deaktiviert. Niemand erhält Technologien als Ereignisgeschenk.

Die Entwurfsstufen I/II/III werden auf native Engine-Tiers 3/4/5 abgebildet: 12 / 14 / 10 Technologien, mit 28.000 / 56.000 / 112.000 Basiskosten vor normalen Forschungsmodifikatoren. Die nativen Tierzugangsschwellen bleiben unverändert. Zum Vergleich definiert Vanilla für Tier 5 16.000 / 20.000 / 24.000 Forschung; die Ära setzt daher eine erhebliche zusätzliche Forschungsinvestition voraus. Sie ersetzt keine alten Technologien und keine normalen Forschungsslots.

Organische Individuen erhalten S04/S07, biologische Schwärme S05/S08, Maschinen einschließlich individueller und synthetisch aufgestiegener Reiche S09. Universelle Infrastruktur hängt von keiner fremden Klassenforschung ab. Nur konventionell nutzbare Hardware-Forschungen schließen Bio-Schiffsreiche aus; der Infrastrukturzweig bleibt auch für diese durchgängig. Der T-Strahl setzt zusätzlich die native Titanen-Technologie voraus. Wilderness nutzt stattdessen bezahlte native Erlasse für Kernfertigung und direkte Infrastruktur-Erträge; normale Jobgebäude bleiben gesperrt. Herkunft und Schiffskategorie werden unabhängig geprüft. Die konkreten Grenzen und Berechnungen stehen im [Nachbesserungsbericht](stage-iv-package-b-review.md).

Abhängigkeiten in der Tabelle verwenden ohne Präfix angegebene EPOCH-IDs als `tech_epoch_iv_<Name>`; `tech_titans` ist Vanilla. Der exakte maschinenlesbare DAG steht in [content.json](../research/stage-iv-b-content.json).

| ID | Exakte Forschungs-ID | Kosten / Engine-Tier | Voraussetzungen | Bereits nutzbarer Effekt |
|---|---|---:|---|---|
| P01 | `tech_epoch_iv_spectroscopy` | unverändert aus A | Storybedingungen aus A | unverändert aus A |
| P02 | `tech_epoch_iv_calibration` | unverändert aus A | Storybedingungen aus A | unverändert aus A |
| P03 | `tech_epoch_iv_sensors` | 28.000 / 3 | `calibration` | Sensorreichweite +1; Zielcomputer (6 Rollen) |
| P04 | `tech_epoch_iv_reconstruction` | 28.000 / 3 | `spectroscopy`, `materials` | Forschungskomplex I |
| P05 | `tech_epoch_iv_fields` | 28.000 / 3 | `calibration`, `materials` | Phasengenerator I; temporaler Stabilisator |
| P06 | `tech_epoch_iv_storage` | 28.000 / 3 | `fields` | Nullfeld-Kollektor I |
| P07 | `tech_epoch_iv_shields` | 56.000 / 4 | `fields`, `steel` | Nullfeld-Schilde S/M/L |
| P08 | `tech_epoch_iv_phase_emitter` | 56.000 / 4 | `fields`, `cores` | Phasenbrecher M/L |
| P09 | `tech_epoch_iv_lance` | 56.000 / 4 | `phase_emitter`, `reactor` | Kausal-Lanze X |
| P10 | `tech_epoch_iv_torpedoes` | 56.000 / 4 | `phase_emitter`, `telemetry` | Nullwellen-Torpedo G |
| P11 | `tech_epoch_iv_hyperdrive` | 56.000 / 4 | `sensors`, `reactor` | Kohärenz-Hyperraumantrieb |
| P12 | `tech_epoch_iv_transcendent_shields` | 112.000 / 5 | `shields`, `reactor` | Transzendenter Schildverbund S/M/L |
| P13 | `tech_epoch_iv_protocol_breaker` | 112.000 / 5 | `lance`, `artillery`, `tech_titans` | Protokollbrecher T (native Titanen erforderlich) |
| P14 | `tech_epoch_iv_coupling` | 112.000 / 5 | `fields`, `harmonization`, `nexus` | Phasengenerator II |
| S01 | `tech_epoch_iv_diagnostics` | unverändert aus A | Storybedingungen aus A | unverändert aus A |
| S02 | `tech_epoch_iv_inversion` | unverändert aus A | Storybedingungen aus A | unverändert aus A |
| S03 | `tech_epoch_iv_restoration` | 28.000 / 3 | `inversion` | Institut I; 20% Rabatt auf optionale Heilung |
| S04 | `tech_epoch_iv_tissue` | 28.000 / 3 | `restoration` | Bezahlte Gewebekalibrierung (organisch) |
| S05 | `tech_epoch_iv_transcription` | 28.000 / 3 | `restoration` | Bezahltes Transkriptionsnetz (Schwarm) |
| S06 | `tech_epoch_iv_ethics` | 28.000 / 3 | `diagnostics`, `reconstruction` | Kausalitätsarchiv I; Wächterakademie I |
| S07 | `tech_epoch_iv_symbiosis` | 56.000 / 4 | `tissue`, `identity` | Bezahlter symbiotischer Lebensraum (organisch) |
| S08 | `tech_epoch_iv_synaptic_nodes` | 56.000 / 4 | `transcription`, `identity` | Bezahlte autonome Synapsenknoten (Schwarm) |
| S09 | `tech_epoch_iv_self_model` | 56.000 / 4 | `restoration`, `identity` | Bezahltes Selbstmodell-Netz (Maschinen) |
| S10 | `tech_epoch_iv_harmonization` | 56.000 / 4 | `restoration`, `ethics` | Institut II; Synergie mit positiven Merkmalen |
| S11 | `tech_epoch_iv_identity` | 56.000 / 4 | `ethics`, `cores` | Kausalitätsarchiv II; Voraussetzung lokaler Klassenprojekte |
| S12 | `tech_epoch_iv_sovereignty` | 112.000 / 5 | `identity`, `harmonization` | Wächterakademie II |
| S13 | `tech_epoch_iv_mandate` | 112.000 / 5 | `sovereignty`, `artillery` | Erlass Wächterdoktrin |
| S14 | `tech_epoch_iv_universal_sovereignty` | 112.000 / 5 | `sovereignty`, `nexus` | Erlass Offene Protokollforschung |
| E01 | `tech_epoch_iv_materials` | unverändert aus A | Storybedingungen aus A | unverändert aus A |
| E02 | `tech_epoch_iv_telemetry` | unverändert aus A | Storybedingungen aus A | unverändert aus A |
| E03 | `tech_epoch_iv_steel` | 28.000 / 3 | `materials` | Architekten-Schmelze I |
| E04 | `tech_epoch_iv_cores` | 28.000 / 3 | `steel` | Kern-Fabrik I; Protokollkerne |
| E05 | `tech_epoch_iv_laboratories` | 28.000 / 3 | `cores`, `reconstruction` | Forschungskomplex II |
| E06 | `tech_epoch_iv_collectors` | 28.000 / 3 | `cores`, `storage` | Nullfeld-Kollektor II |
| E07 | `tech_epoch_iv_artillery` | 56.000 / 4 | `steel`, `cores`, `telemetry` | Fraktale Artillerie L; Schmelze II |
| E08 | `tech_epoch_iv_reactor` | 56.000 / 4 | `cores`, `storage` | Protokollreaktor (9 native Hüllengruppen) |
| E09 | `tech_epoch_iv_armor` | 56.000 / 4 | `steel`, `reactor` | Phasenpanzerung S/M/L mit begrenzter Reparatur |
| E10 | `tech_epoch_iv_fighters` | 56.000 / 4 | `telemetry`, `cores` | Autonome Schwarmjäger H |
| E11 | `tech_epoch_iv_point_defense` | 112.000 / 5 | `artillery`, `fighters` | Fraktale Punktverteidigung P |
| E12 | `tech_epoch_iv_fabrication` | 112.000 / 5 | `artillery`, `laboratories` | Architekten-Schmelze III |
| E13 | `tech_epoch_iv_nexus` | 112.000 / 5 | `laboratories`, `identity` | Forschungskomplex III |
| E14 | `tech_epoch_iv_uap_core` | 112.000 / 5 | `fabrication`, `nexus`, `coupling` | Kern-Fabrik II |

## Kernwirtschaft, Produktion und Knappheit

`epoch_protocol_cores` ist die einzige neue Ressource. Sie hat ein natives Lager von 15.000 zuzüglich normaler Lagerboni, keine Markt- oder Diplomatieversorgung und keine kostenlose Startproduktion. Die Anzeige wird mit der Fabrikationsforschung sichtbar. Kleine/graue/große Icons sind unter eigenen Ressourcennamen vorhanden; die Darstellung verwendet Vanilla-Materialgrafik.

Kern-Fabriken besitzen 300 / 600 besetzbare Jobkapazität und höchstens eine pro Kolonie über beide Ausbaustufen, ohne starre Reichsgrenze. Die Basisstufe prüft beide vorhandenen Ausbaustufen; höhere Produktion verlangt weitere Kolonien, Gebäudeslots und Belegschaft. **Fabriken und ihre Jobs brauchen selbst keine Kerne.** Der Start benötigt ausschließlich Mineralien, Legierungen und Energie.

Pro voller 100er-Belegschaft erzeugen Fertiger 2 Kerne gegen 12 Mineralien, 2 Legierungen und 6 Energie. Dazu kommen 4 / 8 Energie Gebäudeunterhalt. Unmodifiziert ergibt das 6 / 12 Kerne je Fabrik, bei sechs vollständig besetzten Endstufen also 72 Kerne pro Monat. Baukosten steigen auf 1.200 / 2.400 Mineralien und 225 / 450 Legierungen; Jobinputs bleiben proportional. Das ist ein Basismodell mit nativer Pop-/Jobskalierung, keine gemessene Ingame-Produktion. Jobsboni und Belegschaft beeinflussen den tatsächlichen Durchsatz.

Alle sieben anderen Gebäudefamilien verbrauchen laufend Kerne: 0,1 je Gebäudestufe plus 0,15 je voller 100er-Belegschaft, Forschung 0,20. Höhere Gebäudestufen benötigen 40 / 80 Kerne beim Ausbau. Jede neue Schiffskomponente und Waffe hat Kern-Baukosten und laufenden Kernunterhalt. Bei einem nativen Kerndefizit gelten -15% Flottenfeuerrate und -25% Produktion der neuen Forschungs-, Schmelz-, Kollektor- und Archivjobs. Hohe Schiffsqualität hängt dadurch von einer realen Versorgung ab.

Eine voll besetzte Endstufe jeder der sieben Verbraucherfamilien benötigt zusammen **5,08** Kerne monatlich (aus den tatsächlichen Tabellen berechnet; die frühere Angabe 5,98 war falsch). Die persönlich gewählte Doktrin benötigt weitere 3. Ein vollständig ausgerüstetes Artillerie-Schlachtschiff kostet 325 Kerne und 0,634 monatlich. Drei Endstufenfabriken versorgen beispielhaft 20 solche Schiffe, einen vollständigen Gebäudesatz, drei beispielhafte Sternbasen und die Doktrin; 14 Fabriken versorgen 200 Schiffe, vier Gebäudesätze und 20 Sternbasen. Die [Belastungsrechnung](stage-iv-package-b-review.md) enthält Inputs, Boni und Defizite.

## Acht Familien mit echten Ausbauten

| Familie | Stufen und Jobkapazität (4.5.3) | Freischaltungen |
|---|---|---|
| lab | 3: 180 / 360 / 540 | `reconstruction` / `laboratories` / `nexus` |
| forge | 3: 200 / 400 / 600 | `steel` / `artillery` / `fabrication` |
| collector | 2: 200 / 400 | `storage` / `collectors` |
| institute | 2: 100 / 200 | `restoration` / `harmonization` |
| archive | 2: 200 / 400 | `ethics` / `identity` |
| phase | 2: 100 / 200 | `fields` / `coupling` |
| factory | 2: 300 / 600 | `cores` / `uap_core` |
| academy | 2: 200 / 400 | `ethics` / `sovereignty` |


Alle Basisgebäude sind baubar, Ausbaustufen ausschließlich über native Upgrade-Pfeile erreichbar. Es gelten passende Zonen-/Gebäudesets, Kolonieslots, Bauzeiten von 360 / 540 / 720 Tagen, 800 / 1.600 / 2.400 Mineralien und 150 / 300 / 450 Legierungen. Forschungsstufen II/III verbrauchen außerdem 1 / 2 exotische Gase im Monat. Alle Familien sind über die Stufen hinweg auf eine pro Kolonie beschränkt.

Jede Familie besitzt einen Spezialisten- und einen Komplexdrohnenjob. Gestalts verwenden Energie statt Konsumgütern. Reguläre Maschinen nutzen die regulären Spezialistenbedingungen. Produktionskategorien erben passende Vanilla-Spezialisierungen für Forschung, Metallurgie, Energie, Einigkeit oder Soldaten.

- Forschung: 1,25 je Disziplin pro voller 100er-Belegschaft, gegen strategischen und zivilen Unterhalt. Gleiche volle 540er-Belegschaft liefert 6,75 je Disziplin statt der nativen 5,4 des 180/180/180-Labors: +25% unmodifizierter Output, zusätzliche Kosten. Auf positiven Resonanzmerkmalen kommen lokal 10% hinzu.
- Schmelzen: 4 Legierungen gegen 8 Mineralien; Maschinen zusätzlich 1,333333 gegen 2,666667. Katalyse ersetzt die Mineralien durch 12 / 16 Nahrung und liefert 5 / 6,666666 Legierungen. Damit bleiben die relativen nativen Maschinen-/Katalyseunterschiede erhalten, bei etwa +33% Grunddurchsatz und proportionalen Eingaben vor weiteren Boni.
- Kollektoren: 10 Energie gegen 2 Mineralien und Kerne je voller 100er-Belegschaft. Die statische Energieversorgung braucht Belegschaft und einen Zonenslot; das ist kein reichsweiter Ertragsbonus.
- Institute: Gesellschaftsforschung, Einigkeit, Annehmlichkeiten und +2 / +4 lokale Stabilität. Stufe II bringt auf einer tatsächlich positiv umgewandelten EPOCH-Welt weitere +5% Forschungsproduktion pro Disziplin. Bestehende Merkmale werden dabei nicht ersetzt oder gestapelt.
- Archive: 5 Einigkeit und 1 Physikforschung je voller 100er-Belegschaft, mit Konsumgüter-/Energie- und Kernunterhalt.
- Phasengeneratoren: besetzte Verteidigungsjobs und 60 / 65% Bombardementreduktion gegenüber 50% des nativen planetaren Schildgenerators. Bei zusätzlichem Vanilla-Schildgebäude wird nur die Differenz von 10 / 15 Prozentpunkten angewandt. Stufe II liefert zusätzlich vier feste Verteidigungsarmeen. Weitere externe Reduktionsquellen und native Caps bleiben ein Laufzeittest.
- Akademien: Einigkeit, Verteidigungsarmeen und 6 Flottenkapazität je voller 100er-Belegschaft. Die Endstufe benötigt 400 besetzte Jobkapazität, Energie, Legierungen und Kerne; sie ersetzt keine kostenlose globale Flottenkapazität. Stufe II erhöht die Armeerekrutierungsgeschwindigkeit um 25%.

## Lokale Klassenentwicklung und Heilung

S03 senkt die bestehenden Diagnose-/Stabilisierungs-/Inversionskosten um 20%, ausschließlich bei echter persönlicher Freigabe und erforschter Adaptiver Sanierung. Die Basiskosten bleiben vor dem Schlüssel unverändert: 600 Energie; 1.800 Energie + 600 Legierungen; 3.500 Energie + 1.500 Legierungen. Danach: 480; 1.440 + 480; 2.800 + 1.200. Native gegenseitig ausschließende Kostentabellen zeigen den tatsächlich geltenden Preis. Alte Beschreibungstexte enthalten keine widersprechenden Festpreise mehr. Sämtliche bestehenden Ziele, Familienwechsel, Rückrufe und Todesnachweise bleiben unverändert.

Die Klassenforschungen liefern bereits reale planetare Entwicklung statt Platzhalter für nicht vorhandene Merkmale. Jede neue Entscheidung kostet 2.000 Energie und 80 Kerne (Fortentwicklung 120), dauert 360 Tage und wirkt zehn Jahre. Sie prüft Freigabe, Technologie, Reichsklasse, Besatzung und bestehenden Zustand erneut beim Abschluss. Fortentwicklungen ersetzen ihre Vorstufe; eine schwächere Variante kann nicht neben der stärkeren gestapelt werden.

| Projekt | Tatsächlicher lokaler Effekt |
|---|---|
| Gewebekalibrierung | +10% Nahrung (lithoide Gründerreiche: Mineralien), +5 Prozentpunkte Bewohnbarkeit |
| Symbiotischer Lebensraum | ersetzt Gewebekalibrierung: +20% Nahrung (lithoide Gründerreiche: Mineralien), +10 Punkte Bewohnbarkeit, +10% Gesellschaftsforschung |
| Transkriptionsnetz | +10% Gesellschaftsforschung, -10% Abweichung |
| Autonome Synapsenknoten | ersetzt Transkriptionsnetz: +20% Gesellschaftsforschung, -20% Abweichung, 3 Verteidigungsarmeen |
| Selbstmodell-Netz | +10% Energieproduktion und Montage |

S13 und S14 erschließen tatsächlich unterhaltene Erlasse. Wächterdoktrin bringt +20% Heimatgebietsfeuerrate und Verteidigungsarmeeschaden. Offene Protokollforschung bringt eine Forschungsalternative und +10% Forschungsjobproduktion. Je Erlass: 1.000 Einigkeit + 100 Kerne Aktivierung; 50 Einigkeit + 3 Kerne monatlich. Forschung, Aktivierung und laufender Bonus verlangen die passende bereits abgeschlossene persönliche Philosophie. Gegenseitige Aktivierung ist gesperrt; auch ein älterer Doppel-Erlass-Spielstand erhält nur den passenden Bonus und Unterhalt. Paket C muss dieselben unveränderten Storyflags verwenden und darf keinen zweiten widersprechenden Philosophiebonus öffnen. E12/E13/E14 liefern jetzt Schmelze III, Forschung III und Fabrik II; sie behaupten keine bereits baubare Megastruktur.

## Sieben Waffen und sechs Komponentenfamilien

Die sieben Waffenfamilien sind Phasenbrecher (M/L), Kausal-Lanze (X), fraktale Artillerie (L), Nullwellen-Torpedo (G), autonome Schwarmjäger (H), fraktale Punktverteidigung (P) und Protokollbrecher (T). Acht native Templates bilden sieben Waffen ab. Größen, Rollen-Tags, Projektilgrafiken und Gegenmaßnahmen folgen den installierten Vergleichsobjekten; drei Rollen erhalten gezielte Änderungen.

| Waffe | Vergleich aus Vanilla 4.5.3 | EPOCH-Schaden / Rolle |
|---|---|---|
| Phasenbrecher M / L | MEDIUM/LARGE_PLASMA_3: 53-140 / 126-336 | 53-140 / 126-336; zwei Kettentreffer mit 18 / 40 Schaden, Reichweite 50 / 70, Schildmultiplikator nur 0,15 |
| Kausal-Lanze X | ENERGY_LANCE_2: 780-1.950 | 1.014-2.535; Belagerungsreichweite 175, Mindestreichweite 60, Feuerzyklus 90, kein Tracking |
| Fraktale Artillerie L | KINETIC_ARTILLERY_2: 195-585 | 253,5-760,5; Schildschaden x3, Panzerung x0,25, Hülle x0,75, Feuerzyklus 60; Mindestreichweite und geringe Genauigkeit bleiben |
| Nullwellen-Torpedo G | TORPEDO_3: 169-254 | 219,7-330,2; kurze Reichweite, Größenfaktor 0,20, volle Schilddurchdringung, durch PD abfangbar |
| Schwarmjäger H | STRIKE_CRAFT_HANGAR_3: 6-17 | 7,8-22,1; 8 Jäger, Schildumgehung, Jagd auf ausweichende Ziele, Flak-Kontermöglichkeit |
| Fraktale PD P | POINT_DEFENCE_3: 4-8 | 5,2-10,4; Raketen-/Jägerabwehr, keine allgemeine Anti-Schiff-Wunderwaffe |
| Protokollbrecher T | PERDITION_BEAM_TITAN: 5.000-10.000 | 6.500-13.000; sehr langsamer Alpha-Schlag, nativer Titanenslot und Kollateraleffekt |

Unveränderte Waffenrollen behalten den begrenzten 30%-Direktschadensbonus. Phasenbrecher geben diesen zugunsten kurzer nativer Kettenblitze auf. Die Lanze tauscht längere Reichweite gegen geringere Dauerfeuerleistung und eine Nahkampflücke; Artillerie tauscht Panzerungs-/Hüllenschaden und Feuerrate gegen stärkere Schildwirkung. Es gibt keinen neuen globalen Schadensbonus. Rohwerte der CSV-Feuerzyklen werden über das dokumentierte `total_fire_time` plus `windup` gesetzt; Jäger verwenden ihr eigenes natives `cooldown`. **Die tatsächliche native Auflösung dieser Inline-Zeitwerte und Designer-DPS muss im gemeinsamen Abnahmelauf gegen die Vergleichswaffen geprüft werden.** Es wird keine Vanilla-Waffen-CSV ersetzt. Gegen einzigartige Krisen-/Reliktwaffen wird keine allgemeine Überlegenheit behauptet.

Die Kosten steigen gegenüber den Vergleichsobjekten, dazu kommen Kerne: z.B. L-Artillerie 220 Legierungen +16 Kerne statt 156 Legierungen, X-Lanze 450 +35 statt 325, T-Strahl 750 +100 statt 500. Die unveränderten Konter verhindern, dass Schildumgehung, Reichweite und Tracking gleichzeitig maximiert werden.

Die sechs Komponentenfamilien ergeben 26 Templates mit Größen-/Hüllen-/Rollenvarianten:

1. Nullfeld-Schilde S/M/L, später transzendenter Verbund innerhalb derselben Familie: 130% / 155% der nativen Hyper-Schilde, mit proportionaler Regeneration und höherem Leistungsbedarf. L = 3.042 / 3.627; Vanilla Dunkle Materie L = 2.925, Psi L = 3.600. Der höchste Verbund liegt also +24% über Dunkler Materie, aber nur +0,75% über exklusiven Psi-Schilden; er ist keine universell 30% stärkere Spezialabschirmung. Höhere Stufen kosten mehr Kerne und Leistung.
2. Phasenpanzerung S/M/L: 130% der Neutronium-Basis, begrenzte feste Reparatur von 0,25 / 0,625 / 1,5 Panzerung am Tag. Mehrere Platten addieren sich; keine Hüllenregeneration. L = 3.042 gegenüber Neutronium 2.340 und seltener Drachenpanzerung 2.925.
3. Protokollreaktor: neun unveränderte native Reaktorgruppen (einschließlich Fregatten über Korvettenlogik, Plattformen, Ionenkanonen und Sternbasen), 125% der Dunkle-Materie-Leistung. Beispielsweise Schlachtschiff 2.500 statt 2.000. Die ursprünglichen Reaktor-Sets/Hüllenprüfungen bleiben erhalten.
4. Kausalitäts-Zielcomputer: Schwarm, Abfang, Linie, Artillerie, Träger und Torpedo. Bewahrt Verhalten, Rollenauswahl und autonome Boni; zusätzlich +5 Tracking, beim Abfangcomputer daher 35 statt 30.
5. Kohärenz-Hyperantrieb: -65% Vorbereitungszeit gegenüber nativ -50%, eine Rückzugschance; kein Sprungantrieb. Native Kernslot-/Hüllenkompatibilität bleibt erhalten.
6. Temporaler Stabilisator: Hilfsslot für konventionelle Militärschiffe und Plattformen; +15% Schildhärtung und +10% relative Ausweichchance, keine flotteweite Zeitmanipulation. Stapelung unterliegt nativen Caps und kostet mehrere Slots.

## KI, Lokalisierung und Assets

Forschung nutzt positive normale Forschungs- und KI-Gewichte, Kernproduktion eine erhöhte Priorität. Die Bau-KI priorisiert Fabriken, prüft positive Legierungs-/Energieversorgung und vermeidet weitere Kernverbraucher bei zu geringem Nettoangebot. Ausrüstung bewahrt die nativen Rollen-/Ziel-Tags und prüft direkt positive monatliche Kernversorgung (>0,25) und mindestens 100 Kerne im Lager. Der marktbezogene Vanilla-Helfer `no_resource_for_component` wird für die nicht handelbaren Kerne vermieden. Das ist statische Quellenkompatibilität; tatsächliche wirtschaftliche Priorisierung der KI muss im Spiel beobachtet werden.

Neue Technologien, Gebäude, Jobs, Entscheidungen, Modifikatoren, Erlasse, Ressourcen und Komponenten besitzen DE/EN-Texte mit BOM, identischen Schlüsseln und nativen Kosten-/Statistiktooltips. Entscheidungs-/Erlassfreigaben werden zusätzlich über Technologie-Featuretexte erklärt. Grafikpfade verwenden vorhandene Vanilla-Assets; neue Ressourcensprites sind ausschließlich additiv.

## Prüfung, Quellen und verbleibende Laufzeitrisiken

Quellstand: `Cygnus v4.5.3 (4e91)`. [SHA-256-Quellenverzeichnis](../research/stage-iv-b-sources.json) und [Inhalts-/Balancevertrag](../research/stage-iv-b-content.json) dokumentieren die tatsächlich gelesenen Primärdateien. Die vorhandene generierte Engine-Dokumentation belegt benutzte Modifier und Trigger. Das native Forschungsmenü, das Ressourcen-Defizitsystem, Gebäudeupgrades und Schiffsslots werden verwendet; keine eigens erfundene UI.

Befehl: `pwsh -NoProfile -File scripts/test_epoch_regressions.ps1`. Ergebnis: alle bisherigen Regressionen und die neue gezielte Paket-B-Regression bestanden. [Vollständige Ausgabe](../research/stage-iv-b-static-checks-2026-11-10.txt). Die Paket-B-Prüfung deckt persönliche Negativfälle, DAG-Erreichbarkeit pro Klasse, konkrete Freischaltungen, Bootstrap, Input-/Upkeepketten, Upgradegrenzen, native Waffenvergleiche, Computerrollen, Pfade und Lokalisierung ab. Alle alten `common/`- und `events/`-Dateien stimmen mit main überein, ausgenommen die ausdrücklich geprüften drei Heilungspreistabellen. Deren übrige Bedingungen und Effekte stimmen strukturell mit main überein; vor Abschluss bleiben alle Preise gleich. Alte Logdateien sind keine Laufzeitevidenz dieses Commits.

Offen bleiben native Inline-Waffenwerte/Feuerzyklen und tatsächliche DPS, Spezialzonen-Baulisten, Lager-/Defizitanzeige, gleichzeitige Upgrade-/Baulimits, KI-Ressourcenplanung, Jobbesetzung/-skalierung unter sämtlichen Modifikatoren, native Caps, Sonderursprünge, Save/Load und Multiplayer. Diese Risiken werden durch Parser- und Zahlenvergleiche nicht als erledigt ausgegeben.

## Ein gemeinsamer Ingame-Abnahmelauf

Der gebündelte Lauf wird durch den [Review-Testplan](stage-iv-package-b-review.md) ergänzt, nicht durch weitere getrennte Testdurchläufe.

1. Mit Vanilla 4.5.3 und diesem PR-Stand einen bestehenden geeigneten Spielstand laden. Vor persönlichem Abschluss sicherstellen, dass kein neuer B-Forschungszweig verfügbar ist; dann den echten persönlichen Abschluss aus A erreichen bzw. einen authentisch abgeschlossenen Kontrollstand verwenden. Keine Konsolen-Schlüssel oder pauschale Forschungsbelohnungen als Erfolgsnachweis.
2. Frühe Kette E03/E04/P04/P06/S03 erforschen: Fabrik ohne Kernbestand bauen, Jobs besetzen, monatliche reale Kosten/Produktion und Lageranzeige beobachten. Verbraucher errichten, erste Ausbauten und den verdienten Heilungsrabatt auf einer weiteren Welt prüfen. Speichern/laden.
3. Mittlere Kette an demselben Wirtschaftssystem prüfen: ein Forschungs-/Schmelzausbau, die passende lokale Klassenentwicklung und ein gemischtes konventionelles Schiff. Kernkosten, Reaktorleistung, Rollencomputer und M/L/G/H/P-Slots im Designer prüfen. Ein kleines organisches, Schwarm- und Maschinen-Kontrollreich prüft jeweils die eigene Entscheidung und Jobvariante; fremde Klassenaktionen bleiben gesperrt.
4. Ultimativen Ausschnitt mit transzendentem Schild, E14-Fabrik und einem nativen Titanen prüfen. Bei gleicher Flottengröße und vergleichbaren Designs gegen hochwertige Vanilla-Ausrüstung antreten; Designer-DPS und tatsächliche Feuerabstände mit Tachyon-Lanze, kinetischer Artillerie und Perdition-Strahl vergleichen. Bestehende Reichweiten-, Torpedo-/PD-/Flak- und Schildkonter beobachten. Nicht alle 42 Technologien einzeln manuell abnehmen.
5. Lager bewusst aufbrauchen, Defizit und Erholung durch wieder besetzte Fabriken prüfen; eine Fabrik ausbauen, eine zweite auf derselben Kolonie blockieren und die Produktion auf einer weiteren Kolonie erweitern. Zwei private Reiche und Save/Load prüfen: der Schlüssel des einen darf dem anderen keine Karten oder Hardware freischalten. Eine endgame KI eine Zeit lang Forschung, Versorgung, Bau und Ausrüstung selbst durchführen lassen. Multiplayer bleibt bis zu einem echten Host-/Client-Test separat offen.

## Geänderte Dateien

Die finale PR-Dateiliste enthält die vollständige Liste. Die Änderungen liegen ausschließlich in:

- `common/technology/epoch_era_technology.txt`
- `common/strategic_resources/epoch_era_resources.txt`
- `common/economic_categories/epoch_era_categories.txt`
- `common/pop_jobs/epoch_era_jobs.txt`
- `common/buildings/epoch_era_buildings.txt`
- `common/component_templates/epoch_era_weapons.txt`
- `common/component_templates/epoch_era_utilities.txt`
- `common/component_sets/epoch_era_sets.txt`
- `common/decisions/epoch_era_decisions.txt` und die drei Kostentabellen in `epoch_ascension_decisions.txt`
- `common/edicts/epoch_era_edicts.txt`
- `common/static_modifiers/epoch_era_modifiers.txt`
- `interface/epoch_era_resources.gfx` und drei Ressourcentexturen unter `gfx/interface/icons/resources/epoch_protocol_cores*.dds`
- DE/EN: neue `epoch_era_l_<Sprache>.yml`, bereinigte Festpreise in `epoch_ascension_l_<Sprache>.yml`
- `scripts/test_stage_iv_b.cjs` und Einbindung in `scripts/test_epoch_regressions.ps1`
- `README.md`, `docs/testing.md`, Statusverweise in den beiden verbindlichen Stage-IV-Dokumenten, dieses Implementierungsdokument und die drei verlinkten Forschungs-/Prüfdateien.
