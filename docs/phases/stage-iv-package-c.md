# Stage IV – Paket C: Aufstieg und Megastrukturen

Implementiert auf `a330bfedcb362c90b5551b283935753ca99cbce7` (geprüftes Paket B), Ziel **Cygnus 4.5.3 (4e91)**. Quellenprüfung und statische Regressionen sind keine Ingame-Abnahme. Es gibt weiterhin genau eine EPOCH-Mod. Der [gemeinsame B+C-Abnahmeplan](stage-iv-b-c-acceptance.md) bündelt die nächste manuelle Prüfung; jetzt ist kein eigener umfangreicher Zwischentest vorgesehen.

## Native Slots und Freigabe

Die installierten Defines setzen `TRADITION_CATEGORIES_MAX = 7` und `ASCENSION_PERKS_SLOTS = 8`; die native Traditionsansicht enthält die dazugehörigen Container. Ein zusätzlicher freigeschalteter Perk über `ascension_perks_add` erhöht nicht nachweislich die nutzbare Höchstzahl dieser Container. Eine kompatible additive Kapazitätserweiterung ist damit nicht belegt: **Vanilla-Grenzen bleiben erhalten.** Keine Defines, GUI-Dateien, fremden Datenbankobjekte oder Abhängigkeiten werden überschrieben. Jeder Finisher schaltet wie Vanilla einen normalen Perk-Slot innerhalb dieser Grenzen frei.

Alle B+C-Freigaben benötigen weiterhin die persönliche Berechtigung, den echten Protokollschlüssel und den Storyabschluss. Der universelle Baum öffnet anschließend den passenden Klassenbaum. Story, B-Forschung und Megastrukturen benötigen keine freien Tradition-/Perk-Slots. Bei bereits sieben gewählten Bäumen bzw. acht belegten Perks bleiben diese zusätzlichen nativen Aufstiegsentscheidungen unerreichbar. Klassenspezialisierung und Philosophie sind optionale Investitionen, keine automatisch verschenkten Belohnungen.

## Vier Traditionenbäume

Jede Zeile besitzt Adoption, fünf einzeln bezahlte Traditionen und Finisher. Reihenfolge der fünf Effekte entspricht den festgelegten Namen in der Spezifikation; das native Layout `tree_11_12` hat die Abhängigkeiten 1→2 sowie 3→4/5.

| Baum | Adoption | Fünf Traditionen | Finisher zusätzlich zum normalen Perk-Slot |
|---|---|---|---|
| Das Vermächtnis | +5 % Forschungstempo | +10 % Einheit; −10 % Gebäudekosten; +1 Forschungsalternative; +3 Stabilität; +30 Flottenkapazität | +10 % Megastruktur-Bautempo; öffnet Klassenbaum |
| Symbiotische Transzendenz | +5 % Bewohnbarkeit | +10 % Bewohnbarkeit; −15 % Gebäude-Bauzeit; −15 % erlittener Armeeschaden; +5 % Wachstum; +5 % Zufriedenheit | +1 Merkmalspunkt für biologische/lithoide Spezies; Klassenperk-Voraussetzung |
| Schwarmkonvergenz | +5 % Einheit | +10.000 Lagerkapazität; +5 % Tätigkeitsproduktion; +5 Stabilität; +10 % Bewohnbarkeit/−10 % Terraformingkosten; +5 % Feuerrate | +1 biologischer/lithoider Merkmalspunkt; Klassenperk-Voraussetzung |
| Souveränes Netzwerk | +5 % Montage | −5 % Tätigkeitsunterhalt; +5 % Forschungstempo; −15 % Gebäude-Bauzeit; +5 Stabilität; −5 % Schiffsunterhalt | +1 Maschinen-/Roboter-Merkmalspunkt; Klassenperk-Voraussetzung |

Organische Individuen einschließlich Lithoiden, biologische Schwärme einschließlich Wilderness sowie Gestalt-/individuelle Maschinen werden über die installierten nativen Klassenprädikate unterschieden. Wilderness tauscht „Resonante Drohnen“ gegen +10 % Megastruktur-Bautempo und „Autonome Knoten“ gegen −15 % Gebäude-Bauzeit. Dadurch liefern diese beiden Traditionen auch ohne gewöhnliche Jobs bzw. Stabilitätswirtschaft einen Effekt. Die übrigen Schwarmtraditionen betreffen auch Terraforming, Flotten und Lagerwirtschaft.

## Fünf echte Ascension Perks

| Perk | Zusätzliche Voraussetzungen | Tatsächliche Effekte |
|---|---|---|
| Lebende Ascension | Symbiose-Finisher, S07/S11, native Genmodifikation | +5 % Arbeitskraft; +2 biologische/lithoide Merkmalspunkte und +2 Auswahlen; zwei organische Merkmale; bezahlte symbiotische Weltentwicklung |
| Ein Bewusstsein, tausend Möglichkeiten | Schwarm-Finisher, S08/S11, native Genmodifikation | +5 % Tätigkeitsproduktion (Wilderness stattdessen +15 % Megastruktur-Bautempo); +40 Flottenkapazität; +2 biologische/lithoide Punkte und Auswahlen; Konvergente Drohnen |
| Das souveräne Protokoll | Netzwerk-Finisher, S09/S11, native Robomodifikation | +10 % Montage; +5 % Feuerrate; +2 Maschinen-/Roboter-Punkte und Auswahlen; Nullwächter-Kern |
| Erbe der Nullwächter | Vermächtnis-Finisher, S13/E07, ausschließlich gespeicherte Wächterphilosophie | +80 Flottenkapazität; +10 % Heimat-Feuerrate; **+5 % Schiffsunterhalt**; +1 Punkt/Auswahl für die vier Archetypen; Protokollgeprägt |
| Freie Konvergenz | Vermächtnis-Finisher, S14/P14, ausschließlich gespeicherte Freiheitsphilosophie | +5 % Forschungstempo; −15 % Terraformingkosten; +1 Punkt/Auswahl für die vier Archetypen; Protokollgeprägt |

Die IDs und exakten Technologieabhängigkeiten stehen im [Inhaltsvertrag](../research/stage-iv-c-content.json). Die Maschinenfreigabe akzeptiert `tech_robomodding` **oder** `tech_robomodding_m`: Letztere ist die native Variante für Maschinen und individuelle Maschinen. Klassenperks schließen die beiden anderen EPOCH-Klassenperks aus. Sie ersetzen oder sperren keine Vanilla-Aufstiege. Ein späterer Klassenwechsel gewährt keinen zweiten EPOCH-Klassenperk.

Beide Philosophie-Perks prüfen in `potential` **und** `possible` die unveränderten Storyflags `epoch_iv_philosophy_guard/free`, einschließlich des Ausschlusses des Gegenflags und Gegenperks. Ihre eigentlichen Modifikatoren sind zusätzlich bedingt: Bei widersprüchlichen Flags oder zwei bereits vorhandenen exklusiven Perks wirken diese Boni nicht gemeinsam. Paket C schreibt keine dieser Storyflags und bietet keine neue Philosophieentscheidung an. Paket-B-Doktrinen und Komponenten bleiben unverändert.

## Fünf Merkmale und freiwillige Anwendung

| Merkmal | Klasse / Punktkosten | Spieleffekt |
|---|---|---|
| Resonante Physiologie | organische Individuen / 1 | +10 % Bewohnbarkeit; −10 % erlittener Armeeschaden |
| Symbiotische Intelligenz | organische Individuen / 2 | +10 % Forscher-Arbeitskraft, ausdrücklich auch für Paket-B-Kohärenzlabore |
| Konvergente Drohnen | biologische Schwärme/Wilderness / 2 | +5 % Arbeitskraft; −10 % Drohnen-Annehmlichkeitsverbrauch; +5 % Bewohnbarkeit |
| Nullwächter-Kern | Maschinen/Roboter / 2 | +5 % Arbeitskraft; −10 % Annehmlichkeitsverbrauch |
| Protokollgeprägt | passende Spezies mit eigenem Philosophie-Perk / 1 | Maschinen +5 % Arbeitskraft; normale Schwärme −15 % Drohnen-Annehmlichkeitsverbrauch; Wilderness +10 % Bewohnbarkeit; organische Individuen +10 % Forscher-Arbeitskraft einschließlich EPOCH-Laboren |

Zugang erfolgt im nativen Speziesvorlagen-Menü mit anschließendem bezahltem Modifikationsprojekt. Archetypen, Schwarm-/Wildernessmarker, Besitzerklasse, eigener Perk und persönliche Berechtigung begrenzen die Auswahl; importierte Vorlagen werden beim Hinzufügen ebenfalls geprüft. Merkmale sind weder Start- noch Zufallsmerkmale. Klassenfremde Merkmale schließen sich gegenseitig aus; die native Unverträglichkeit von Invasive Species mit positiven Anpassungsmerkmalen wird auch bei Vorlagenimport ausdrücklich respektiert. Protokollgeprägt kann den passenden Klassenbonus ergänzen. Entfernung ist erlaubt.

Es gibt keine Skript-Spezieskonvertierung, kein erzwungenes Hinzufügen und keine Entfernung psionischer, kybernetischer, genetischer, synthetischer oder Maschinen-Aufstiegsmerkmale. Die additive Resonanzanpassung kann mit einer passenden bestehenden Vanilla-Aufstiegsart koexistieren. Native Grenzen für Punkte, Auswahlen und Modifikation bleiben gültig; insbesondere werden Ursprünge/Civics mit gesperrter Genmodifikation nicht umgangen. KI-Gewichte und Vorlagen-Montagewert sind vorhanden; die tatsächliche KI-Anwendung bleibt Ingame-Abnahme.

„Symbiotische Weltentwicklung“ kostet 3.000 Energie, 1.000 Legierungen und 100 Kerne, dauert 360 Tage und gewährt auf einer bereits positiv harmonisierten organischen Kolonie dauerhaft +10 % Tätigkeitsproduktion und +5 % Bewohnbarkeit. Ein persistenter Modifikator verhindert die Wiederholung. EPOCH-Merkmalsfamilien und frühere Storyentscheidungen bleiben erhalten.

## Drei physische Megastrukturen

Es gibt genau **drei, drei und vier gebaute Stufen**, jeweils einschließlich einer bereits funktionierenden ersten Stufe. Kein leerer Bauplatz wird als zusätzliche Inhaltsstufe gezählt. Konstruktion/Ausbau erfolgt nativ mit Konstruktionsschiffen. Alle Stufen benötigen Mega-Engineering sowie die jeweilige B-Forschung: Nexus E13/P14, Schmiede E12, Interface E14/P14 und die passende S13-/S14-Philosophietechnologie. Das Interface benötigt die persönliche Storyphilosophie, keinen freien Perk-Slot.

Bauplatz: eigenes, vollständig vermessenes Sternbasensystem ohne vorhandene Megastruktur; ein vermessener, nicht kolonialisierbarer Planet, kein Stern, Mond, Asteroid, Ringwelt, Astralriss, Anomalie- oder bereits belegter Träger. Keine Himmelskörper werden zerstört oder umgewandelt. Erweiterungen bleiben an derselben Anlage. Bauvorbehalte werden bei Start gesetzt und bei Abbruch/Fertigstellung entfernt. Erst `on_build_complete` aktiviert die Anlage; diese persistente Markierung bleibt bei Ausbau/Save/Load am Objekt.

| Anlage | Monatlicher Stufeneffekt I / II / III / IV | Monatlicher Unterhalt I / II / III / IV |
|---|---|---|
| Resonanz-Nexus | je Forschungsfeld 100 / 200 / 300; Kerne 4 / 8 / 12; Stabilität +1 / +2 / +3; Terraformingkosten −5 / −10 / −15 % | Energie 40 / 80 / 120; Kerne 2 / 4 / 6 |
| Architekten-Schmiede | Legierungen 100 / 200 / 300; Kerne 20 / 40 / 60 | Energie 60 / 120 / 180; Mineralien 400 / 800 / 1.200 |
| UAP – Wächter | Legierungen 30 / 60 / 90 / 120; Flottenkapazität +40 / +80 / +120 / +160; Heimat-Feuerrate +5 / +10 / +15 / +20 % | Energie 100 / 200 / 300 / 400; Kerne 10 / 20 / 30 / 40 |
| UAP – Freiheit | je Forschungsfeld 100 / 200 / 300 / 400; Einheit 20 / 40 / 60 / 80; Forschungstempo +2,5 / +5 / +7,5 / +10 %; Terraformingkosten −5 / −10 / −15 / −20 % | wie Wächter |

Kosten **je Zielstufe**, nicht kumuliert: Nexus/Schmiede 6.000 / 12.000 / 18.000 Legierungen, 200 / 400 / 600 Kerne und 2.000 / 4.000 / 6.000 Einheit. Interface 10.000 / 20.000 / 30.000 / 40.000 Legierungen, 600 / 1.200 / 1.800 / 2.400 Kerne und 2.000 / 4.000 / 6.000 / 8.000 Einheit. Stufe I dauert 1.800 Tage, jeder weitere Ausbau 3.600 Tage, vor nativen Bauzeitmodifikatoren. Der Zielstufenunterhalt ersetzt jeweils den Vorgänger.

Ein Nexus liefert maximal **6 Kerne netto**, die Schmiede skaliert durch bezahlte weitere Anlagen in anderen Systemen. Eine Schmiede III plus Nexus III versorgt ein Interface IV und lässt **26 Kerne/Monat** für Paket-B-Verbraucher übrig; zusammen kosten diese drei Anlagen 700 Energie und 1.200 Mineralien/Monat. Diese Rechnung ersetzt weder die Flotten-/Kolonieversorgung noch ein Balancing-Playtest. Bei Energie-/Kernmangel bzw. Mineralienmangel der Schmiede stoppt die neue Ressourcenproduktion, die Unterhaltsforderung bleibt bestehen. Nach Wiederherstellung durch B-Fabriken bzw. Wilderness-Kernwirtschaft kann der Betrieb weitergehen.

Nexus und Interface erlauben je eine eigene Anlage. Zählen Eroberungen mehrere Anlagen desselben begrenzten Typs zum Besitz, **ruhen alle Leistungen dieses Typs**, bis überzählige Anlagen demontiert sind. Das verhindert mehrfach funktionierende Anlagen auch nach Besitzwechsel, statt eine zufällige aktive Anlage zu wählen. Demontage ist für den Besitzer nativ verfügbar, kostet 1.000 Energie und dauert 360 Tage; sie entfernt nur EPOCHs eigene Trägermarkierung. Es gibt keine Demontageerstattung oder erneute Storybelohnung. KI-Baugewichte berücksichtigen Energie, Mineralien bzw. positiven Kernüberschuss; die KI erhält keine Gratisanlagen. Eine automatische Auswahl/Demontage eroberter Doppelanlagen ist nicht implementiert.

Nexus und freies Interface öffnen zusätzlich **netzgestützte Resonanzinversion** auf eigenen, sicher behandelbaren Welten. Diagnose und Stabilisierung bleiben notwendig. Nach 180 Tagen und 2.400 Energie, 900 Legierungen und 60 Kernen wird über denselben geprüften A-Effekt genau eine Familie positiv konvertiert; mit aktivem freiem Interface sinkt der Preis auf 1.600/600/40. Fertigstellung prüft Infrastruktur, Besitzer und Familiensperren erneut. Ein unfertiges, doppelt vorhandenes, unberechtigtes oder unterversorgtes Netz genügt nicht. Der bestehende Effekt kann im abgeschlossenen Kapitel keine persönliche Belohnung erneut vergeben.

## UI, Save/Load und Quellen

DE/EN besitzen identische Schlüssel und UTF-8-BOM. Neue GFX-Sprite-IDs verwenden passende vorhandene Vanilla-Texturen, Kategorieflächen, Icons und physische Modelle; keine fremde GUI wird ersetzt und keine neue exklusive Illustration behauptet. Das Interface IV verwendet das vollständige Koordinationsmodell auch für seine vierte funktionale Stufe. Die [SHA-256-Quellenliste](../research/stage-iv-c-sources.json) dokumentiert die installierten Primärquellen einschließlich nativer Ressourcen-/Modifier-/Callbackmuster und Modifikationsvarianten. Die generierte Engine-Dokumentation war bereits vorhanden und wurde nur gelesen.

Alle bisherigen `common/`, `events/` und `interface/`-Dateien von B bleiben byteinhaltlich nach Zeilenendennormalisierung erhalten. Native Auswahlzustände, Speziesvorlagen, permanente Planetenmodifikatoren und Objektflags werden gespeichert. Es gibt keine On-Load-Belohnung, erneute Schlüsselvergabe, freie Technologie oder neue Migration alter Storyzustände. Ein Rückwechsel auf B nach Nutzung neuer C-Objekte wird nicht als unterstützt behauptet.

## Prüfung und verbleibende technische Risiken

`scripts/test_stage_iv_c.cjs` ergänzt die bestehende Gesamtsuite: vollständige Klassen-/Philosophiematrix einschließlich Lithoiden, Wilderness, individuellen und aufgestiegenen Maschinen; negative Schlüssel-/Abschlussfälle; widersprüchliche Philosophieflags und doppelte Perks; Vorlagenzugang und fremde Merkmalskombinationen; reale Ausbauketten, Baukosten, Kernlagergrenze, Unterhalt, Defizit und Besitzkappen; unfertige Anlagen; exklusive Heilungspreise; Modifikator-/Grafik-/Lokalisierungsverweise und unveränderte A/B-Skripte. Ergebnis und Zähler stehen im [Prüfprotokoll](../research/stage-iv-c-static-checks-2026-11-10.txt).

Nicht Ingame validiert sind: tatsächliche Menü-/Tooltipdarstellung und Verfügbarkeit aller nativen Tradition-/Perk-/Vorlagenentscheidungen; native Auswertung der bedingten Megastrukturressourcen und Besitzer-/Objektscopes; Modifier-Aktualisierung bei Ausbau und Besitzerwechsel; Konstruktionsabbruch, Demontage und Unterbrechung; KI-Forschung, Bau und freiwillige Modifikation; reale Langzeitbalance; Save/Load, Sonderursprünge und Multiplayer. Die Vanilla-Dokumentation für Ressourcen nennt teils Länderscope, während das installierte Shroud-Seal-Beispiel `owner` im Ressourcen-Trigger verwendet; C folgt dem ausführbaren Beispiel, das im gebündelten Lauf ausdrücklich geprüft wird. Der native Platzierungshelfer zählt bekannte Vanilla-Typen auf: EPOCH prüft beim eigenen Neubau sämtliche vorhandenen Megastrukturen, kann aber spätere Vanilla-Bauentscheidungen im selben System ohne Override nicht ändern. Diese Grenzen sind offen ausgewiesen und keine behaupteten Engine-Abnahmen.

## Gezielte PR-19-Reviewkorrekturen

Ausgangsstand `021cbb14ced853280cf6d3881787c9b9a02e52af`: Der beschriebene Drohnen-Wilderness-Swap fehlte tatsächlich in der Definition; der Knoten-Swap ließ die Vererbung implizit. Beide verwenden jetzt ausdrücklich `inherit_effects = no`, `inherit_name = no`, `inherit_icon = yes`, entsprechend `tr_versatility_finish` in Vanilla `common/traditions/00_versatility.txt`. Damit erhalten ausschließlich passende Wilderness-Reiche die vorhandenen alternativen Namen und +10 % Megastruktur-Bautempo bzw. -15 % Gebäude-Bauzeit. Die normalen Produktions-/Stabilitätsboni werden ersetzt. Lokalisierung und Werte des Inhaltsvertrags waren bereits vorhanden und bleiben unverändert.

Die symbiotische Weltentwicklung prüft unmittelbar vor der permanenten Belohnung jetzt sämtliche Startbedingungen erneut: Kolonie, existierender zulässiger Besitzer mit organischem Klassenperk, persönlicher Protokollabschluss, Harmonisierungstechnologie, mindestens eines der drei positiven Deposits und noch kein Symbiosemodifikator. Der Verlust einer Voraussetzung während der Bauzeit gewährt keine dauerhafte Verbesserung. Die Netz-Inversion wiederholt ihre Bedingungen bereits vollständig; der unveränderte A-Effekt `epoch_iv_convert_world` prüft zusätzlich sicheren Weltzustand, passende Diagnose und besitzerspezifische Stabilisierung. Neue Negativfälle prüfen diese Schutzkette für alle drei Familien. A/B-Spielskripte und Storyentscheidungen wurden nicht geändert.

Kurzer Kompatibilitätscheck gegen installierte 4.5.3-Quellen: `category = normal` bleibt für Protokollgeprägt erhalten. `common/traits/18_nomads_species_traits.txt` definiert mit `trait_structural_awareness` und `trait_interconnected` reguläre, kostenpflichtige ROBOT-/MACHINE-Merkmale mit `species_possible_add` und derselben Standardkategorie; die Trait-Dokumentation nennt `normal` ausdrücklich als Default. Kategorie und erlaubter Archetyp sind getrennte Eigenschaften. Der native Modifikationszugang bleibt durch `common/game_rules/00_rules.txt:can_modify_species` und die vorhandenen Technologien beschränkt. Das ist Quellenkompatibilität, kein ausgeführter Menütest.

Für reguläre Wilderness-Reiche erlauben die nativen Potentials von `tech_genome_mapping` und `tech_gene_tailoring` die normale Forschungskette; letztere aktiviert `modify_traits`. Die native organische Modifikationsregel akzeptiert diese Technologie. `is_natural_design_empire` sperrt Gene Tailoring weiterhin für entsprechende Civics; diese sowie weitere native Modifikationssperren werden nicht umgangen. Es ist keine zusätzliche Freischaltung oder sechste Merkmalsvariante nötig. Die [Quellenliste](../research/stage-iv-c-sources.json) enthält die ergänzten Belege; der vorhandene gemeinsame B+C-Ingame-Plan bleibt gültig.
