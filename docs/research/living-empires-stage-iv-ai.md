# Living Empires: erster Stage-IV-KI-Schritt

Basis: `main` / `4ce4518df9088d77ce93cde5342c75bdd0332b94`.
Ziel: **Stellaris 4.5.3 (4e91), Build 26325427**.
Stand: 15. November 2026. Implementierung und statische Regressionen;
kein neuer Spieltest, keine manuelle Testaufgabe für den Nutzer.

## Verhalten und Grenzen

`epoch_iv.82` wartet auf eine eigene, freie Militärflotte außerhalb eines
Kampfes, mit Systemreferenz, mindestens 75 % Hülle je Schiff und erreichbarer
persönlicher Arena. Ihre aktuelle Flottenstärke muss sowohl **über 30.000**
als auch **über der aktuellen Stärke der persönlichen Wächterflotte** liegen.
Der numerische Triggervergleich berücksichtigt den gegenwärtigen Enginewert
einschließlich der Wächtermodifikatoren; die bisherige feste Untergrenze bleibt
als zusätzliche Vorsicht bestehen. Flotten werden nicht zusammengelegt.
Flottenstärke ist eine Auswahlhilfe, keine Zusicherung eines Kampfsieges.

Die Zielprüfung verlangt das eigene aktive Kapitel V, den lebenden gespeicherten
Hauptgegner mit persönlicher Schiffskennung in seiner Wächterflotte, deren
Wächterbesitzer mit passendem Claimant und die eigene Arena. Fremde, ausgemusterte,
fehlende oder bereits erledigte Ziele erhalten keinen neuen Angriffsauftrag.

Die vorhandene Monatsprüfung ruft `epoch_iv.83` **vor** der nächsten Auswahl
auf. Die Bereinigung liegt vor dem bisherigen Eligibility-Filter und erreicht
dadurch auch gespeicherte KI-Aufträge nach Abschluss oder Kampagnenabbruch.
Ein laufender Anflug bleibt ohne Zeitlimit bestehen; ein laufender Kampf wird
nicht durch die Monatsprüfung unterbrochen. Der Auftrag wird einmal erteilt,
solange `epoch_iv_ai_attack_ordered` gesetzt ist, erfolgt keine erneute Auswahl.

`epoch_iv.84` prüft bei beiden nativen Kampfbeitritts-Callbacks, ob der Primärgegner
oder eine weitere gegnerische Flotte der gespeicherte persönliche Wächter ist.
Die Monatsprüfung kann die Teilnahme anhand der gegnerischen Flotten auch dann
erkennen, wenn der Beitritt vor dem Laden eines Spielstands stattfand.
`epoch_iv.85` beendet die Verfolgung beim Ende eines bestätigten Wächterkampfs,
auch beim Rückzug mit überlebender Flotte. Ein fremdes Gefecht allein beendet
den Anflug auch in der persönlichen Arena nicht. Ein Ende in der Arena dient
nur bei übernommenen Aufträgen vor dem ersten beobachteten Kampfbeitritt oder
Monatsabgleich als Ersatznachweis. In diesem kurzen Übergangsfenster kann ein
fremdes Gefecht weiterhin die Wartezeit auslösen, wenn es bereits beim Laden lief.

Monatlich werden eine zerstörte/verschwundene oder inzwischen fremde gespeicherte
Flotte, Leerlauf sowie belegte Rückkehr-, Reparatur- und Ausweichaufträge erkannt.
Ein gemerkter persönlicher Kampf ohne laufenden Kampf wird ebenfalls bereinigt,
falls der Exit-Callback ausblieb. Eine fehlende Systemreferenz allein gilt **nicht**
als Ende: Sie könnte einen laufenden Transit betreffen. Es gibt keinen erfundenen
`auto_follow_fleet`-Status oder Timeout. Eine anderweitig umgeleitete, weiterhin
beschäftigte Flotte wird erst bei einem solchen beobachtbaren Ende freigegeben;
ein beliebiger Wechsel des Follow-Ziels ist damit nicht zertifiziert auslesbar.

Nach der Bereinigung gilt eine **180-Tage-Sperre**. Danach entscheidet die KI beim
nächsten Monatsimpuls neu, sobald eine geeignete freie Flotte vorhanden ist.
Dabei kann auch die reparierte überlebende Flotte erneut gewählt werden. Der
Bereinigungseffekt verändert keine Flottenbefehle und keine fremden Flotten.
Die Kampfmarkierung für neu erteilte oder beobachtete Aufträge begrenzt diesen
Übergang auf einzelne gespeicherte Aufträge. Laufende Reisen bleiben erhalten,
alte Leerlauf-Sperren werden aufgehoben und verwaiste Referenzen gelöscht.
Der vorhandene kostenpflichtige Recovery-Pfad rekonstruiert weiterhin
allein einen fehlenden Wächter und setzt vor dem Neubau dieselbe KI-Verfolgung
einschließlich Kampfmarkierung und Wartezeit zurück.

## Siegnachweis und Umfang

`epoch_iv.50` und `epoch_iv_valid_military_death` bleiben unverändert. Nur der
bisherige tatsächliche persönliche Hauptgegner-Tod kann den bestehenden Siegpfad
auslösen. Die neuen Ereignisse vergeben weder Forschungsoptionen noch
Protokollschlüssel, Kampfnachweis oder Fortschritt. Kampfende, Rückzug,
Cooldown-Ablauf und Zielverlust sind keine Siege. Die Regression friert gezielt
diese beiden bestehenden Siegblöcke ein. Spielerentscheidungen, Wächterwerte,
Recovery-Kosten und andere Inhalte bleiben unverändert.

## Belege

| Aussage | Grundlage und Belegstärke |
|---|---|
| Direkter numerischer Vergleich der Flottenstärke ist verfügbar | Paradox beschreibt Scope-/Variablenvergleiche für `fleet_power` bereits im [Dev Diary 204](https://forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-204-scripting-language-and-moddability-improvements.1461327/) vor 3.0. Das lokal gelesene Vanilla-Event `aquatics.180` verwendet `fleet_power > from.starbase.fleet.trigger:fleet_power`. Die Verwendung in 4.5.3 ist aus dieser älteren API-Zusage und dem fortbestehenden Vanilla-Muster abgeleitet, kein ausgeführter 4.5.3-Vergleichstest. |
| Kampfbeitritt und -ende haben die verwendeten Fleet-Scopes | `common/on_actions/00_on_actions.txt`: ROOT/FROM sind beim Beitritt Flotten; beim Exit ist ROOT die austretende Flotte, unabhängig vom Kampfausgang. Die lokal gelesene Datei hat SHA-256 `b85054a739808e7e9e213bb4d189fed1eeb930e8f16c9b36bdfdbe82ce59fe1f`, identisch zum archivierten [4.5.3-/26325427-Manifest](stage-iii-source-manifest-2026-11-08.json). Dieser Versionsbeleg wird durch den optionalen Native-Check automatisch geprüft. |
| Gegnerische Flotten eines laufenden Gefechts sind im Fleet-Scope abfragbar | Die archivierten [Engine-Trigger-Logs](https://github.com/OldEnt/stellaris-triggers-modifiers-effects-list/blob/master/3.12.5_game_triggers.log) dokumentieren `any_combatant_fleet` für Flotten. Das [Vanilla-Fleet-Event `leviathans.1014`](https://qunxing.huijiwiki.com/wiki/Data%3AEvents/leviathans.1014.json) verwendet den Trigger in der archivierten Fassung 4.5.2. Die Auswertung beim EPOCH-Kampfbeitritt und Monatsabgleich wurde im Skriptmodell geprüft. |
| Leerlauf und beobachtbare Ersatzaufträge | Vanilla `utopia.3323` verwendet `is_fleet_idle`; die vorhandene generierte Dokumentation nennt Fleet-Scope und die Rückkehr-/Reparatur-/Ausweichaufträge für `has_fleet_order`. `auto_follow_fleet` selbst dokumentiert keinen zuverlässig auslesbaren Zielstatus. |
| Tatsächlich verfügbare Installation | `launcher-settings.json`: **4.5.4 (1b4f)**; Steam-Manifest: **26557690**. Callback-Datei wie oben hashgleich zu 4.5.3. Für die übrigen aktuell gelesenen Vanilla-/Dokumentationsdateien wird kein vollständiger 26325427-Fingerprint behauptet. |

## Ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `node scripts/test_release_ci.cjs` | Alle 13 spielunabhängigen Prüfkommandos bestanden, einschließlich der neuen Stage-IV-Auswahl und der CI-Kopie mit zulässigen späteren Gameplay-Ergänzungen. Der direkte SteamCMD-Bash-Test wird unter Windows explizit übersprungen. |
| `node scripts/test_stage_iv.cjs . --source-only` | 605 Assertions: bestehende Eligibility-, Todes-/Sieg-, Konvertierungs- und Recovery-Szenarien; zusätzlich vollständige KI-Rücksetzung vor dem Wächter-Neubau. |
| `node scripts/test_stage_iv_ai.cjs . --source-only` | 198 Assertions am geparsten produktiven Skript, darunter fremde Gefechte in der Arena mit und ohne Monatsabgleich, ein persönlicher Wächter unter weiteren Gegnern, Rückzug, Altaufträge, Flottenverlust und Besitzwechsel. Der Arena-Regressionstest scheiterte vor der Korrektur und besteht mit ihr. |
| `node scripts/test_stage_iv_ai.cjs . G:/Steam/steamapps/common/Stellaris --native-evidence` | Beim ursprünglichen PR-Stand 11 zusätzliche Vanilla-/Dokumentations-Assertions, einschließlich Hashabgleich der Callbacks mit dem gewünschten Build. Für die Korrektur wurde dieser optionale lokale Lauf nicht wiederholt. |
| `node scripts/test_stage_iv_runtime_contracts.cjs .` | 630 statische Verträge bestanden, mit den lokal verfügbaren Vanilla-Quellen. |
| `node scripts/test_stage_iv_c_runtime_contracts.cjs .` | 619 statische Verträge bestanden, mit den lokal verfügbaren Vanilla-Quellen. |
| `git diff --check` | Bestanden. |
| `node scripts/test_stage_iv.cjs .` ohne `--source-only` | Erwartungsgemäß am unveränderten Versionsnachweis `target version present` gestoppt: lokal ist 4.5.4 statt 4.5.3 installiert. Daher kein vollständiger 4.5.3-Native-Pass behauptet. |

Die Modelle interpretieren die produktiven Bedingungen und Effekte, simulieren
aber keine Engine-Reise, MIA-Abwicklung, Befehlsausführung, Gefechte oder echten
Save-/Load-/Multiplayerlauf. Timerablauf und Flottenzustände sind explizite
Modellgrenzen. Historische D1/D2-Unveränderlichkeitstests beschreiben frühere
Text-/Audit-PRs und sind für diesen beauftragten Gameplay-Schritt kein Release-Gate.
