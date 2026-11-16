# Issue #36 / PR #38: Startwege und isolierter Engine-Stand

16.11.2026, Windows-PC des Inhabers. **Start und Save/Load nachgewiesen; vollständige KI-Regression weiterhin `blocked`.** Alle folgenden Eingriffe und UI-Schritte wurden vom Agenten ausgeführt. Der Inhaber musste keinen Spielstand vorbereiten oder Kampf spielen. Keine Workshop-Veröffentlichung.

## Wiederholen

Im Repository auf `codex/issue-36-engine-test`, Steam laufend:

```powershell
powershell.exe -NoProfile -File .\scripts\test_stage_iv_engine.ps1 -LoadCandidate -SeedProbe -DebugMode -TimeoutSeconds 900
```

Das startet die vorhandene Installation mit einem neuen isolierten Profil und ausschließlich EPOCH plus Testmarker. Es ist ein **Start-/Diagnose-Gate**, kein fertiger unbeaufsichtigter Kampftest. Exit **3** bleibt `blocked`, auch bei erfolgreichem Start. Ein Prozessende durch den Timeout ist kein Crash. Der Gate verweigert vorhandene Stellaris-Prozesse, ein vorhandenes Installations-`userdir.txt` und reguläre Profilpfade/Junctions. Er schreibt temporär ein ASCII-`userdir.txt` in die Installation und entfernt nur seine unveränderte eigene Datei im `finally`. Bei einem extern abgebrochenen PowerShell-Host muss diese Datei vor weiteren Starts geprüft werden.

Jeder Aufruf hat eine neue UTC-/GUID-Laufkennung unter `G:\EPOCH-Stellaris-Test\runs`. `report.json` enthält Commit, Build, Runner-Hash, tatsächliche Prozessargumente, Exitcode/Timeout und Hashes der frischen Logdateien genau dieses Laufs. Rohlogs und Dumps bleiben lokal. Shader-/Account-Caches sind keine Testbelege. Der produktive Mod wird mit `git archive` aus dem exakten Commit extrahiert; Testhilfen liegen ausschließlich in `scripts/` und `test-mods/`, außerhalb des Workshop-Pakets. Native JSON-Manifeste werden ohne UTF-8-BOM geschrieben; ein erster BOM-Versuch lud EPOCH nicht und zählt ausdrücklich nicht als Mod-Ladebeleg.

Der lokal selbst erzeugte, gehashte Ausgangsstand ist zusätzlich wiederverwendbar:

```powershell
powershell.exe -NoProfile -File .\scripts\test_stage_iv_engine.ps1 -SeedFixtureDirectory 'G:\EPOCH-Stellaris-Test\fixtures\seed-save-load-v1' -DebugMode -TimeoutSeconds 900
```

Dieser Aufruf übergibt `-continuelastsave`, dessen Ladefunktion hier **nicht funktioniert hat**. Das tatsächliche Laden wurde anschließend über die lokale UI automatisiert. Diese UI-Steuerung wurde in der Agentensitzung ausgeführt und ist noch nicht in den PowerShell-Befehl integriert. Ein Marker allein kann deshalb nicht beweisen, welcher Ladeweg benutzt wurde. `-StopAfterSeedLoad` beendet den eigenen Prozess nach einem frischen nativen Marker; es steuert kein Menü. `-LaunchMethod Steam` öffnet den Paradox-Launcher und wartet begrenzt auf dessen Spielprozess. `-ProfileMethod Argument` reproduziert den defekten Direktstart; `-DebugMode` ist unabhängig schaltbar.

## Installation und Startvergleich

Installation `G:\Steam\steamapps\common\Stellaris`, Steam-Build **26557690**, Engine **Cygnus v4.5.4**. Vanilla-Prüfsumme **1b4f** tatsächlich im Hauptmenü beobachtet. EXE-SHA256 `10d2613a392fe8ac7982701899dc2e43ebf4c1c721ea1baeba6c3fb25db36eb1`. Launcher **2026.14**. Laufendes Steam wurde bestätigt. Der normale Test nutzte ein neues leeres Playset `EPOCH-36-Startup-NoMods`; PLAY statt RESUME, keine regulären Spielstände geladen.

| Weg / UTC / PID | Tatsächliche Spielargumente (private Token entfernt) | Ergebnis / neue Logs |
|---|---|---|
| Steam → Paradox PLAY, 08:33:00 / 27080 | `--pdx-launcher-session-token <redacted> --paradox-account-userid <redacted> -dx11 -gdpr-compliant` | Hauptmenü `1b4f`, keine Mods; UI beendet, Exit **0** um 08:34:35; neue reguläre Logs lokal gesichert |
| Direkt, 08:35:07 / 27532, Run `20261116T083507546Z-cb51240a` | `-userdir="G:/EPOCH-Stellaris-Test/runs/20261116T083507546Z-cb51240a/profile" -gdpr-compliant -dx11` | Exit **-1073741819**, keine Profil-Logs; Event 1000 / 121580 |
| Steam → Paradox PLAY, 08:36:51 / 21728 | Token-Argumente wie oben plus `-userdir=G:/EPOCH-Stellaris-Test/diagnostics/20261116-launch-comparison-a/launcher-profile -dx11 -gdpr-compliant` | Exit **-1073741819**, neues Profil leer; Event 1000 / 121583 |
| Direkt mit Debug / 28896, Run `20261116T083910324Z-9bf09a82` | `-userdir="G:/EPOCH-Stellaris-Test/runs/20261116T083910324Z-9bf09a82/profile" -gdpr-compliant -dx11 -debug_mode` | gleicher Absturz vor Profilinitialisierung |
| Direkt ohne Profilargument / 12432 | `-dx11 -gdpr-compliant` | Hauptmenü `1b4f`, UI beendet, Exit **0** um 08:40:55 |
| Direkt mit temporärem `userdir.txt` / 19924 | `-dx11 -gdpr-compliant` | isoliertes Hauptmenü `1b4f`, neue `settings.txt`, `logs/system.log`, `setup.log`; reguläre Logs unverändert; Exit **0**. Timeout/Exit-Rennen in der manuellen Probe, kein sauberer Timeout-Beleg |
| Direkt, Seed-Run `20261116T084837419Z-139118c3` / 30224 | `-gdpr-compliant -dx11 -debug_mode`, temporäres `userdir.txt` | EPOCH geladen: Setup-Einträge und Hauptmenü **49ac**; neue isolierte Logs, Seed erzeugt/gespeichert/geladen |
| Steam → Paradox PLAY, Run `20261116T091338662Z-12834752` / 22764 | Token-Argumente wie oben plus `-gdpr-compliant -dx11 -debug_mode -continuelastsave -dx11 -gdpr-compliant`, temporäres `userdir.txt` | isoliertes EPOCH-Hauptmenü **a588** mit korrigierter 1000-Schiff-Probe, frische isolierte Logs; Seed per UI geladen; Spiel-Exit **0**, Steam-Handoff **0**, Redirect entfernt |

Die vollständigen unveränderten Commandlines liegen ausschließlich lokal in `diagnostics/20261116-launch-comparison-a/process-trace.jsonl` und den Laufberichten. Der erste Poller hatte doppelte nachträgliche PID-Beobachtungen; ausschließlich der erste tatsächliche Exit mit erhaltenem Prozesshandle wird verwendet. Der versionierte Poller unterdrückt diese Duplikate. Der Vergleich widerlegt einen allgemeinen Startausfall der Installation; Debug oder fehlende Launcher-Tokens erklären den reproduzierten Profilargument-Absturz nicht allein.

Beim isolierten Launcher-Lauf änderte der Launcher den Zeitstempel der regulären **`dlc_load.json`** (47 Bytes; leeres Testplayset), nicht die regulären Engine-Logs. Der konservative Metadatenvergleich des Runners meldet deshalb `regularProfileUnchanged=false`. Die Engine-Profilnutzung ist durch die frischen isolierten Logs/Mods/Save nachgewiesen; vollständige Schreibfreiheit des regulären Launcher-Profils wird ausdrücklich **nicht** behauptet. Der direkte `userdir.txt`-Start vermeidet diesen Launcher-Schreibzugriff.

## Exakter Crash-Stack

Kein bereits vorhandener Dump ließ sich dem neuen Lauf zuordnen. Deshalb wurde [Microsoft ProcDump](https://learn.microsoft.com/en-us/sysinternals/downloads/procdump) von Sysinternals geladen, dessen Microsoft-Authenticode-Signatur geprüft und ein neuer Prozess ohne Debug-Modus unter ProcDump gestartet:

```text
procdump64.exe -accepteula -mm -e -x <dump-run> <stellaris.exe> -userdir=G:/.../procdump-userdir-nodebug/profile -dx11 -gdpr-compliant
```

PID **29908**, unhandled Exception um **08:37:50 UTC**. Minidump `stellaris.exe_261116_093750.dmp`, **25,354,222 Bytes**, SHA256 `fbde5e03331bde4cc88078d43e6f907b492a3c96f7e2b49f88cb1323ac9e808f`. ProcDump meldete den geschriebenen Dump; sein Exitcode war 1. Lokaler Pfad: `G:\EPOCH-Stellaris-Test\diagnostics\20261116-launch-comparison-a\procdump-userdir-nodebug`.

[Microsoft WinDbg](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/) wurde über `winget install --id Microsoft.WinDbg --exact --source winget` installiert (Paket 1.2611.4001.0). Analyse mit `!analyze -v; .ecxr; kv; lmvm stellaris`, anschließende Disassemblierung mit dem mitgelieferten `amd64/cdb.exe`. Gesicherte Befunde:

- **0xC0000005 / Access violation, READ Adresse 0**, fehlerhaftes Modul `stellaris.exe`, RVA **0x1caed25**. `RAX=0`, `R8=0`, Instruktion `cmp byte ptr [rax+r8],0`.
- Unmittelbar davor ruft RVA **0x1caed13** den echten Export **`PHYSFS_getWriteDir`** auf. Sein Null-Rückgabewert wird anschließend ungeprüft dereferenziert. Das belegt den Absturzmechanismus; warum die Engine an dieser Stelle keinen Write-Dir hat, ist ohne private Symbole nicht gesichert.
- Modulbasis ``00007ff7`88ac0000``, PE-Zeitstempel `6AF23393`, PE-Checksumme `02AE9FFC` (keine Stellaris-Spielprüfsumme).

```text
stellaris+0x1caed25
stellaris+0x1ad3c3
stellaris+0x14fd76
stellaris+0x14bc57
stellaris+0x206da82
stellaris+0x2028a1e
kernel32!BaseThreadInitThunk+0x17
ntdll!RtlUserThreadStart+0x2c
```

Keine privaten Stellaris-PDBs verfügbar. Große Export-plus-Offset-Namen im automatischen Stack sind nächstgelegene Exportnamen und **keine** verlässlichen internen Funktionsnamen. `!analyze` meldete außerdem `WRONG_SYMBOLS` für ntdll; Register, Rohadressen, Modul-RVAs und disassemblierte EXE-Instruktionen sind die belastbaren Befunde. Dumps, Tokens und sämtliche unbereinigten Debugger-/Engine-Logs wurden nicht eingecheckt.

## Szenario und tatsächlich geladenes Save

Produktiver Mod-Commit **`59885296e0ac65bd11486dd5a56dac76ee8a23b1`**, enthält korrigierten PR #33; produktiver Inhalt entspricht dem damaligen `develop`. Szenarioversion **`seed-save-load-probe-v1`**. Eigene native Galaxie: UNE, 200 Sterne, 1 KI, Seed **590813443**, Ironman aus, lokal gespeichert. Der Testmarker setzt ausschließlich eigenen Namen/Flags und protokolliert deren Persistenz; er bestätigt keinen Kampf.

| Beleg | Wert |
|---|---|
| Quelllauf | `20261116T084837419Z-139118c3` |
| Erzeugungszeit in Engine | **2200.01.01**, `state=seed-created` im frischen `game.log` |
| Save | `save games/unitednationsofearth_-15512622/2200.01.01.sav`, 537622 Bytes |
| SHA256 | `74c78511ae722a4739f4edd9a6f2aac3532a71ecc5d13b91a79f78863cd337fd` |
| Save-Prüfung | ZIP-`gamestate`: Datum, `epoch36_seed_v1`, laufbezogenes Flag und Name vorhanden; `scripts/inspect_stellaris_seed.ps1` prüft dies separat |
| UI-Reload | **2200.01.01**, Reichsname `EPOCH36_20261116T084837419Z-139118c3` im tatsächlich geladenen Reich beobachtet |

Die Fixture unter `G:\EPOCH-Stellaris-Test\fixtures\seed-save-load-v1` enthält nur die selbst erzeugten Mod-/Testdaten, Einstellungen, Save, Manifest und `continue_game.json`; keine regulären Saves, Accountdateien oder Rohlogs. **Steam-Cloud-Save-Metadaten waren dennoch in der nativen Ladeliste sichtbar.** Es wurde ausschließlich das eigene lokale Save geladen. Die lokale Profilisolation ist nachgewiesen, eine vollständig abgeschaltete Steam-Cloud-Kataloganzeige nicht.

`-continuelastsave`: Run `20261116T090503832Z-3c4feacb` endete nach 180 Sekunden per Timeout ohne Marker (allein nicht aussagekräftig über fertig geladenes Menü). Die längere Wiederholung `20261116T091012335Z-010a3bc1` erreichte mit demselben Argument das Hauptmenü, ohne Save zu laden. Erst der UI-Klick auf den eigenen lokalen Save erzeugte **um 09:11:35 UTC / 2200.01.01** den nativen `state=marker-present`. Damit ist der UI-Ladeweg belegt und der Parameter hier kein zuverlässiger Ersatz.

Abschließende Wiederholung mit dem gehärteten Fixture-Runner: **`20261116T092040096Z-d277e5af`**, PID **21644**, Runner-SHA256 `fe2b40b91e706669dd2bdc3d5fe23defde19998fada318768de7c1a94d4d7db3`, Hauptmenü **9202** mit aktueller Markerprobe. Wieder kein automatisches Laden. Nach dem agentenseitigen UI-Laden: **09:22:14 UTC / 2200.01.01 `marker-present`** aus dem persistierten Quelllauf. Der Runner beendete seinen Prozess gezielt mit `stopReason=seed_marker_observed`, Prozess-Exit **-1**, **kein Timeout/Crash**; Redirect entfernt, reguläre Konfigurations-/Log-Metadaten unverändert. Die unterschiedlichen Mod-Prüfsummen gehören zu unterschiedlichen Test-Overlays, nicht zu einem behaupteten Vanilla-Buildwechsel.

Bereinigte [Laufzusammenfassungen und Save-/UI-Receipts](follow-up-evidence/run-summaries.json) enthalten nur ausgewählte Belege und Hashes. Die frühen automatischen Berichtstexte der ersten Ladeprobe schrieben den UI-Marker fälschlich `continuelastsave` zu; dieser Bericht korrigiert die Zuordnung ausdrücklich. Der finale Runner meldet nur die Save-Identität und verlangt eine separate Beobachtung des Ladewegs.

## Native Stage-IV-Probe und offene Abnahme

Die optionale Testhilfe `-BattleAttempt` bereitet die Ausgangslage vor, ruft den **produktiven** `epoch_iv_spawn_judge` auf und erzeugt eine eigene Kandidatenflotte. Sie setzt keine produktiven Auftrags-, Engagement-, Rückzugs-, Cooldown- oder Siegflags, ruft den produktiven Angriffs-Event nicht direkt auf und beobachtet täglich höchstens 720 Tage. Aufträge müssen aus dem normalen Monatsabgleich kommen.

Erste Probe `20261116T091012335Z-010a3bc1`: **2200.01.01 `personal-target-valid`, `ai-prepared`**, **2200.01.02 `candidate-power-insufficient`** mit 200 Enforcern. Außerdem war die Positionierung `event_target:epoch_iv_anchor@root.star` in der Testhilfe ungültig; dies wurde für die nächste Probe über einen expliziten Stern-Eventtarget korrigiert. UI-Simulation bis **2201.07.13**, dann nativer Erstkontakt-Popup mit Auto-Pause. Kein Angriffsauftrag oder Kampf beobachtet. Dieser Lauf beweist keine 180-tägige Rückzugssperre: Es gab keinen Rückzug.

Korrigierte Probe **`stage-iv-setup-probe-v2`**, Run `20261116T091338662Z-12834752`, über den isolierten Launcher-Weg mit **1000 Enforcern**: **2200.01.01 `personal-target-valid` / `ai-prepared`**, **2200.01.02 `candidate-power-above-target`**, **2202.01.01 `observation-ended`** nach genau 720 Beobachtungstagen. Keine `attack-order-observed`-, Combat-, Exit- oder Cooldown-Marker in diesem Lauf. Vorübergehende native Popup-Pausen wurden vom Agenten bedient. Nach Ende der Probe lief die Simulation weiter und wurde bei **2210.10.27** über die UI beendet; die Probe deckt ausdrücklich nur ihre 720 Tage ab.

Das eigene Autosave **2201.07.01** (SHA256 `036a9c4050e95833c675b86dd788c9831544dccce26a0ea48a4741aa9fcf7145`) enthält `epoch_iv_clock_scheduled`, Kapitel 5 und `epoch36_observed_days=540`, aber weder `epoch_iv_ai_attack_ordered` noch `epoch_iv_ai_fleet@...`. Der Monatslauf hat also produktiven Kampagnenzustand verändert, ein Auftrag ist nicht nachgewiesen. Das Log protokolliert an diesem Datum zudem native KI-Zahlungsausfälle; der Kandidaten-Flottenmarker ist im Save nicht mehr vorhanden. Frühere Flotteninformationen im Save sind **kein** Beleg für eine weiterhin existierende geeignete Flotte. Ob die anfängliche Flotte am Monatsabgleich alle weiteren Bedingungen (idle, gesund, Militärklasse, Zugang) erfüllt hat, wurde nicht gemessen. Die präparierte Flotten-/Wirtschaftskonstellation ist damit als Rückzugsszenario ungeeignet; kein Produktfehler beim erneuten Angriff lässt sich daraus ableiten.

Frische Logs des EPOCH-Seedstarts enthalten **159 EPOCH-root-bucket-Diagnostikzeilen**, keine 159 unabhängig identifizierten Fehlerursachen: überwiegend falsch gescopte Country-/Technologie-Trigger aus `common/megastructures/epoch_c_megastructures.txt` (u.a. Zeilen 38, 67, 96, 233/234 und Folgeblöcke). Der vorhandene Runtime-Classifier endet **1**. Die Probe war somit kein sauberer Runtime-PASS. Ein kausaler Zusammenhang dieser Megastrukturdiagnostik mit dem noch ausstehenden Kampf ist nicht bewiesen; Vanilla-Nomadenfehler wurden separat gehalten.

**Offen:** belastbarer unbeaufsichtigter UI-Lader/Observer, geeignete Flottenkonstellation mit echtem überlebtem KI-Rückzug und lebendem Wächter, präziser 180-Tage-/Monatsabgleich-Nachweis, derselbe Fall vor PR #33 (`4ce4518df9088d77ce93cde5342c75bdd0332b94`) rot und korrigiert wiederholt grün. `observe` / `fast_forward` sind nicht verifiziert; Konsolen-Tastaturversuche öffneten kein nutzbares Eingabefeld. Die Simulation wurde tatsächlich per nativer Pause-/Geschwindigkeits-UI gestartet und beschleunigt.

Der Startblocker ist umgangen. Der nächste konkrete Schritt ist die korrigierte Kandidatenprobe mit gemessener Flottenstärke und gesicherten Combat-/Exit-Hooks; danach muss ein lokaler UI-Lader/Observer in den Runner integriert werden. Ein erfolgreicher Start oder gesetzter Testmarker darf das fehlende Rückzugsszenario nicht als bestanden ausgeben.

## Prüfung der Änderungen

- `powershell.exe -NoProfile -File scripts/test_stage_iv_engine_gate.ps1`: bestanden, ohne Spielstart. Fehlende Installation, alte Logs, manipuliertes Fixture-Save und überlappendes reguläres Profil werden vor einem Spielstart abgewiesen.
- `node scripts/test_release_ci.cjs`: alle **13** spielunabhängigen Kommandos bestanden; Bash-Untertest im eingeschränkten Windows-Kontext explizit übersprungen. Ein zusätzlicher unsandboxed Versuch mit erkanntem Git-Bash scheiterte im bestehenden SteamCMD-Shelltest an `tar: Cannot connect to C: resolve failed`; kein Workshop-Upload ausgeführt. Dies ist eine Windows-Pfad-Portabilitätsgrenze dieses separaten Tests, kein Engine-PASS.
- Frischer Runtime-Classifier: Fehlerstatus 1, oben beschrieben; keine historischen Logs als neue Belege verwendet.
- Produktive Mod-Dateien unverändert. Das Review prüfte insbesondere die genaue Commit-Herkunft, Marker-Persistenz statt bloßer Event-Ausführung, fehlende automatische Zuordnung eines Markers zu `-continuelastsave`, begrenzte Testarbeit und Entfernen ausschließlich des eigenen Redirects. Fixture-Läufe extrahieren im finalen Runner den Produktcode erneut aus Git und vertrauen keiner kopierten Mod-Datei im Fixture.

Bereinigung abgeschlossen: kein Test-Spielprozess oder Launcherfenster mehr offen, Installations-`userdir.txt` entfernt. Ursprüngliches aktives Playset **IronyModManager** wieder ausgewählt; dessen Inhalt nicht bearbeitet. Die reguläre `dlc_load.json` wurde nach dem Schließen des Launchers aus der Vorher-Sicherung bytegenau wiederhergestellt (SHA256 `038aa8e4cddd84ee0efc8e8db1dfe614728f39cebd13411cce9babd3e67977b9`); `settings.txt` entspricht ebenfalls der Vorher-Sicherung. Das neue leere Diagnoseplayset und die lokalen Testartefakte bleiben für Wiederholungen erhalten. Reguläre Saves wurden nicht geladen oder geschrieben.
