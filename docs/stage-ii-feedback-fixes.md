# PR #13: Gameplay- und Runtime-Korrekturen

Stand: 8. November 2026. Ziel: installierte Stellaris-Version 4.5.3, bestehender Branch `codex/stage-ii-resonance`. Dieses Paket Ã¤ndert weder die Stage-I-Abschlussentscheidung noch die militÃ¤rischen Beteiligungs- und ZerstÃ¶rungsnachweise. Es wurde kein neuer PR erstellt und nicht gemergt.

## Die zehn Ingame-Befunde

| Befund | Implementierte Korrektur |
|---|---|
| 1. Gleichartige Untersuchungen mit unterschiedlichen Preisen | Feldarbeit bleibt bevorzugt. Archivarbeit erscheint bei fehlendem/unzugÃ¤nglichem Original oder zur Fortsetzung einer bereits gewÃ¤hlten Rekonstruktion. Beide erfordern echte Projektarbeit. Feldboni und Kosten stehen in DE/EN-Tooltips. |
| 2. Doppelte Recovery und Situation-Warnungen | Recovery ausschlieÃŸlich Ã¼ber die Hauptstadt-Entscheidung. Die Situation zeigt weiterhin fÃ¼nf Kapitel und einen Beobachtungsansatz mit `on_select`-Tooltip. `GFX_situation_approach_research` und `GFX_situation_approach_bg_green` existieren in Vanilla. Auch die Legacy-Situation verwendet sie. |
| 3. Hunter im Hauptstadtsystem | Zwei begrenzte Suchen: bevorzugt eigene Systeme 2â€“6 HyperraumsprÃ¼nge entfernt, danach eigene oder unbesessene Systeme 1â€“8 SprÃ¼nge entfernt. Fremdbesitz, feindliche Flotten und unzugÃ¤ngliche Ziele werden ausgeschlossen. Ein Flotten-Pfadtest prÃ¼ft entfernte Ziele; ein direkter Nachbar funktioniert auch ohne eigene Flotte. Das Ziel wird als besucht markiert und im Briefing benannt. |
| 4. AufklÃ¤rung mit blockiertem Wissenschaftsschiff | Optionales natives Projekt fÃ¼r 600 Physikforschung, ohne Schiff/Wissenschaftler; `location = no`. Abschluss schwÃ¤cht den Waffenschaden der zugeordneten Hunter um 15% fÃ¼r 1800 Tage. Ein Forschungserfolg ist kein militÃ¤rischer Sieg. |
| 5. AufklÃ¤rung nach Sieg | BestÃ¤tigter Sieg bricht offene AufklÃ¤rung ab. Abgeschlossene AufklÃ¤rung bleibt vermerkt. Kapitel-/Sieg-/EinmalprÃ¼fungen verwerfen verspÃ¤tete AbschlÃ¼sse; Recovery erzeugt das Projekt nach Kapitel 2 nicht neu. |
| 6. Kapitel-3-Auswahl ohne erkennbare Folgen | Feldbergung: 300 Ingenieurforschung; Feldsignatur: 200 Physikforschung plus Vorbereitung. Archivarbeit verliert diese Boni. Riskante Analyse: 600 Physikforschung, 1800 Tage âˆ’2% Energieproduktion und instabile Kontamination in Kapitel 4. Vorsichtiger Vergleich erzeugt diese zusÃ¤tzlichen Risiken nicht. |
| 7. Unsichtbare Kapitel-4-Decisions | Direkte Planet-/Colony-IdentitÃ¤t entfernt. EigentÃ¼mergebundene Carrier-Markierung, aktive KapitelprÃ¼fung und jeweilige Voraussetzungen werden bei Sichtbarkeit bzw. Effekt geprÃ¼ft. Recovery repariert alte ZielbezÃ¼ge und erhÃ¤lt QuarantÃ¤ne, Lokalisierung, Proben und Feature-Zustand. |
| 8. Permanenter Abbruch mitten in Stage II | Nur noch zwei Abschlussoptionen nach allen drei Kapitel-5-Ergebnissen: ausdrÃ¼cklich fortsetzen oder dauerhaft beenden. Erst Fortsetzen setzt `epoch_res_stage_iii_ready`. Beide erhalten Forschung, SchÃ¤den und Signale. |
| 9. Dynamische Texte und UI-Assets | Country-keyed Global-Target-AusdrÃ¼cke werden nicht mehr direkt in Lokalisation eingebettet. Briefings speichern lokale Namenstargets; Scripted Localization bietet verstÃ¤ndliche Fallbacks. DE/EN bleiben UTF-8 mit BOM; englischer Planet-Apostroph ist ASCII. Decisions verwenden das vorhandene `decision_resources`-Icon. |
| 10. Undefined-Target-Warnungen | LÃ¶schen der EPOCH-eigenen Enemy-/Hunter-/Engagement-Targets ist durch ExistenzprÃ¼fungen geschÃ¼tzt. Die vorhandenen reichsgebundenen IdentitÃ¤ten bleiben maÃŸgeblich; es werden keine fremden Kampagnen Ã¼bernommen. |

## Ursache und Fortsetzung von Kapitel 4

Der bisherige `potential`-Block verlangte gleichzeitig einen Infektionsflag und `is_same_value = event_target:epoch_ii_target_planet@owner`. Der gespeicherte Bezug kann eine Colony sein, wÃ¤hrend das MenÃ¼ den physischen Planeten verwendet. Diese Objekte sind in 4.5.3 verschieden. Die generierte Skriptdokumentation bestÃ¤tigt dagegen ausdrÃ¼cklich, dass `has_planet_flag`/`set_planet_flag` bei Colony auf den Carrier zugreifen. Der IdentitÃ¤tsvergleich konnte deshalb alle sieben EintrÃ¤ge ausblenden, obwohl das EinfÃ¼hrungsevent und die Infektion existierten. Die neue Zuordnung verwendet genau diese dokumentierte gemeinsame Flag-Semantik und eine Markierung je Kampagnenreich.

Bestehenden Kapitel-4-Checkpoint mit der aktualisierten Mod laden. Auf der Hauptstadt **Resonanzoperationen fortsetzen** ausfÃ¼hren und danach den im Briefing genannten Planeten Ã¶ffnen. Das repariert die Markierung sofort; alternativ erfolgt die Reparatur beim jÃ¤hrlichen LÃ¤nder-Puls. Das System normalisiert den gespeicherten Bezug auf die aktuelle Colony, Ã¼bernimmt bestehende bezahlte Aktionen und verÃ¤ndert deren Feature-Zustand nicht. Ein fehlender Bezug wird zuerst an einem bereits infizierten eigenen Planeten wiedergefunden. Erst ein tatsÃ¤chlich verlorenes/ungeeignetes Ziel erzeugt eine neue Operation auf einer geeigneten eigenen besiedelten Welt. Alte SchÃ¤den bleiben an ihrer Welt.

Alle sieben Entscheidungen bleiben sichtbar; unerfÃ¼llte Voraussetzungen sperren die jeweilige AusfÃ¼hrung. QuarantÃ¤ne und Lokalisierung kÃ¶nnen zuerst erfolgen. Bei instabiler Kontamination: QuarantÃ¤ne, Isolation, dann regulÃ¤r stabilisieren; alternativ nach Lokalisierung die teurere NotfalleindÃ¤mmung. Die Effekt-Guards prÃ¼fen die Voraussetzungen erneut nach den 60â€“90 Tagen. Ein Besitzwechsel oder ein bereits abgeschlossener Schritt kann dadurch keine fremde Welt verÃ¤ndern oder dieselbe Belohnung erneut auslÃ¶sen. Die bestehenden drei Stage-I-Featurefamilien und ihre Produktionsfolgen bleiben erhalten.

## Echte Unterschiede zwischen Untersuchungen

| Untersuchung | Feldarbeit | Recovery im Heimatgebiet |
|---|---|---|
| Narbe | 150 Energie, 180 Tage; +150 Physik und Vorbereitung | 450 Energie, 180 Tage; keine Felddatenboni |
| Referenzmessung | 200 Energie, 180 Tage; +200 Physik und Vorbereitung | 500 Energie, 180 Tage; keine Felddatenboni |
| Wrackbergung | 200 Energie, 210 Tage; +300 Ingenieurforschung | 600 Energie, 210 Tage; nur gesicherte Kampfdaten |
| Signatur | 150 Energie, 150 Tage; +200 Physik und Vorbereitung | 450 Energie, 150 Tage; bei archiviertem Wrack ebenfalls Archivarbeit |
| Analyse | Vorsichtig: 150 Energie, 180 Tage, beide Forschungsoptionen | Riskant: 100 Energie, 180 Tage, beide Forschungsoptionen plus 600 Physik, Energiebelastung und instabile Infektion |

Alle diese Untersuchungen brauchen weiterhin ein bemanntes Wissenschaftsschiff. Vorbereitung erstattet beim Beginn von Kapitel 4 einmalig 100 Energie, unabhÃ¤ngig davon, wie viele Vorbereitungsquellen vorliegen. Feldboni werden durch die echten ProjektabschlÃ¼sse ausgezahlt. Bezahlte, unterbrochene Archivprojekte werden bei Recovery kostenlos neu ausgegeben, sofern sie weder aktiv noch abgeschlossen sind. Bereits aktive Projekte und veraltete Popup-Auswahlen kÃ¶nnen nicht doppelt bezahlt werden.

## Native Evidenz und Laufzeitgrenzen

Vorbild der AufklÃ¤rung ist **`AMOEBAS_PACIFICATION_PROJECT`** in `common/special_projects/00_projects_2.txt`: positiver `cost`, `physics_technology`, `location = no`, `event_scope = planet_event`, Abschluss Ã¼ber `prev = { country_event = ... }`. Vanilla `distar.50` aktiviert dieses Muster am Kapitalobjekt mit der Projekt-Country als Owner. EPOCH Ã¼bernimmt denselben Callback und verwendet `AI_wait_days = { weight = 5 }`. Die installierte `documentation.txt` bestÃ¤tigt PREV = Projektland und die Forschungskosten-Semantik. Ein alter aktiver AufklÃ¤rungsauftrag wird beim erneuten Kapitel-2-Briefing einmalig in das Forschungsprojekt Ã¼berfÃ¼hrt; sein alter zeitbasierter Fortschritt ist nicht in Physikpunkte umrechenbar. Ein bereits besiegter Checkpoint bereinigt offene AufklÃ¤rung beim jÃ¤hrlichen Puls.

Die Hunter-Suche erzeugt kein neues Sternensystem. Gibt es selbst unter den sicheren Fallbacks kein geeignetes erreichbares System, bleibt Kapitel 2 offen und Recovery kann nach einer Ã„nderung der ZugÃ¤nglichkeit erneut suchen. Es gibt keinen Spawn auf der Hauptstadt und keinen erfundenen Sieg. Bereits existierende Flotten alter Checkpoints werden nicht teleportiert. Der echte ZerstÃ¶rungs-Callback speichert das tatsÃ¤chliche Kampfsystem erneut fÃ¼r die Wrackzuordnung.

Nach Kapitel 5 schlieÃŸt die Situation, aber die Abschlusswahl steht noch aus. Ein verlorenes Abschlussfenster wird jÃ¤hrlich erneut angeboten. Alte vollstÃ¤ndig abgeschlossene Saves mit dem bisher automatisch gesetzten Handoff werden einmalig auf die explizite Abschlusswahl migriert; bereits ausdrÃ¼cklich getroffene neue Entscheidungen werden nicht erneut geÃ¶ffnet.

Regressionen: `scripts/test_epoch_regressions.ps1`, inklusive Stage I, Clausewitz-Struktur, Stage-II-VerhaltensprÃ¼fungen, Logklassifikator und `test_resonance_vanilla.cjs`; zusÃ¤tzlich `git diff --check`. Die Vanilla-PrÃ¼fung liest die installierten Definitionen und die generierten `scopes.log`, `triggers.log`, `effects.log`; deren Ort lÃ¤sst sich Ã¼ber `EPOCH_SCRIPT_DOCUMENTATION` vorgeben. Das erweitert die Evidenz Ã¼ber den statischen Interpreter hinaus, ersetzt aber keine Engine-AusfÃ¼hrung.

Offen fÃ¼r die gezielte Ingame-Abnahme: tatsÃ¤chliche Decision-Anzeige und AusfÃ¼hrung aus dem alten Checkpoint, Feature-/Produktionsanzeige nach Save/Load, natives Fortschrittsfenster und PREV-Callback der neuen AufklÃ¤rung, Flotten-PfadprÃ¼fung auf kleinen/abgetrennten Reichen, zeitlich begrenzter Flottenmodifikator, AI-Projektaufnahme und Multiplayer-Isolation. Die vorhandenen Kampf-Callback-Reihenfolge-Risiken bleiben unverÃ¤ndert. Die alte `error.log` ist Fehlerevidenz; sie ist kein neuer Lauf mit diesem Paket und belegt keine nachtrÃ¤glich fehlerfreie Laufzeit.

Validierung am 8. November 2026: **697** Gesamtsuite-Prüfungen, **5.287** Stage-I-Flow-Prüfungen, **1.121** Stage-II-Vertrags-/Interpreterprüfungen, **27** Prüfungen gegen installierte Vanilla-/Skriptdokumentation, Strukturprüfung von **28** Clausewitz-Dateien und Logklassifikator-Selbsttest bestanden. `git diff --check` bestanden. Kein neuer Ingame-Lauf.
