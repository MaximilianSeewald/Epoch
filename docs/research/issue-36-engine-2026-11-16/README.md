# Issue #36: Engine-Test vor Profilinitialisierung blockiert

**16. November 2026: `blocked`.** Die vorhandene Installation stürzt beim isolierten Direktstart vor dem ersten Engine-Log ab. Kein Spielstand wurde geladen, keine Ingame-Zeit ist verstrichen, kein Stage-IV-Ablauf wurde in der Engine beobachtet. Dieser PR liefert einen wiederholbaren Start-Gate mit Diagnose, noch keinen fertigen Kampftest.

## PowerShell-Aufruf

Im Repository-Stamm, ohne Klicks:

```powershell
powershell.exe -NoProfile -File .\scripts\test_stage_iv_engine.ps1
```

Standard: Installation `G:\Steam\steamapps\common\Stellaris`, Testwurzel `G:\EPOCH-Stellaris-Test`, Mod-Revision `HEAD`, Prozesstimeout 60 Sekunden. Die archivierten Wiederholungen verwendeten `-TimeoutSeconds 15`. **Exitcode 3 bedeutet `blocked`**. Dieser Start-Gate kann keinen Kampf-PASS melden, auch wenn ein späterer Start erfolgreich sein sollte.

Jeder Aufruf erzeugt `G:\EPOCH-Stellaris-Test\runs\<UTC-ID>\` mit einem anfangs leeren `profile\`. Argumente: `-userdir="G:/EPOCH-Stellaris-Test/runs/<UTC-ID>/profile" -debug_mode`. Er archiviert den exakt aufgelösten Git-Commit als `candidate.zip` (nur produktive Mod-Dateien), schreibt Build, Harness-Hash, Prozess-ID, Exitcode, Timeout und frische Dateien in `report.json` und ordnet Windows-Absturzfelder nach PID und Startzeit zu. Der Timeout beendet ausschließlich den selbst gestarteten Prozess; diese Beendigung wurde hier nicht erreicht, weil die Prozesse vorher abstürzten.

Der Mod wird erst nach verifizierter Profilnutzung zu aktivieren sein; der Gate stellt ihn zunächst außerhalb des Profils bereit. Reguläre Spielstände/Playsets werden weder gelesen, kopiert noch geladen. Verglichen werden ausschließlich Größe und Änderungszeit ausgewählter regulärer Konfigurations-/Logdateien (`regular-before.json` / `regular-after.json`). Bestehende Stellaris-Prozesse, überlappende Profilpfade und Junctions im Testpfad verhindern den Start.

## Installation und Kandidat

| Merkmal | Ergebnis / Beleggrenze |
|---|---|
| Mod-Kandidat aus `develop` | `c0a1c73a4eba08a8d2bff6995f2b3390a474d31a`; archiviert, **nicht in der Engine geladen** |
| Geplanter fehlerhafter Vergleich vor PR #33 | `4ce4518df9088d77ce93cde5342c75bdd0332b94`; **kein Engine-Lauf** |
| Korrigierter PR-#33-Stand | `373c804804851ae848f6657f369611d944ea06ca`, in `develop` enthalten; **kein Engine-Vergleich** |
| Installierte Launcher-Metadaten | `Cygnus v4.5.4 (1b4f)` |
| Steam-Build-ID | `26557690`, aus vorhandenem `appmanifest_281990.acf` |
| Prüfsumme | `1b4f` **aus Launcher-Metadaten**; tatsächliche Engine-Prüfsumme nicht beobachtet |
| SHA-256 `stellaris.exe` | `10d2613a392fe8ac7982701899dc2e43ebf4c1c721ea1baeba6c3fb25db36eb1` |
| Harness | `stage-iv-startup-gate-v1`; SHA-256 `a8b1e25b7395186df7f8d5f3f873df7fee5a096198e0e9a22e1e4ae350fb1cd7` |
| Kampfszenario-Version / Ingame-Zeitpunkte | **nicht vorhanden**; kein Kampfszenario oder Testspielstand erzeugt |

## Zwei unabhängige Wiederholungen

Jeder Bericht wertet ausschließlich sein eigenes Laufverzeichnis aus. Lokale Verzeichnisse enthalten zusätzlich `candidate.zip`; dieses aus Git reproduzierbare Archiv wird nicht nochmals ins Repository aufgenommen. Beide Archive haben SHA-256 `644f58eeee87f423814c258297eb86e010163a577f4e497d9b1adb684684d922`. Archiviert sind jeweils Bericht, Launcher-Metadaten und reguläre Vorher-/Nachher-Metadaten. Windows-Rohberichte, Speicherabbilder, Steam-Konto-ID und reguläre Spielinhalte werden nicht veröffentlicht.

| Bericht | Prozessstart UTC (Berlin +01:00) | PID | Windows-Ereignis | Ergebnis |
|---|---|---|---|---|
| [20261116T075911524Z-7cf1f350](20261116T075911524Z-7cf1f350/report.json) | 07:59:11.825 | 2316 | 1000 / Record 121565, 07:59:12.606 UTC | `blocked`, Exit `-1073741819` |
| [20261116T075916003Z-fc479ac2](20261116T075916003Z-fc479ac2/report.json) | 07:59:16.347 | 18500 | 1000 / Record 121567, 07:59:17.072 UTC | `blocked`, Exit `-1073741819` |

Beide Prozesse: Ausnahmecode **`c0000005`**, Modul `stellaris.exe`, Offset **`0000000001caed25`**. Beide Profile enthalten **keine Engine-Dateien**; die verglichenen regulären Metadaten sind unverändert. Erfolgreiche Profilisolation ist damit **nicht bewiesen**. Die Ursache des nativen Absturzes ist unbestimmt; sie wird nicht dem EPOCH-Mod zugeschrieben.

Zuvor wurde der ausdrücklich angeforderte Pfad `-userdir=G:/EPOCH-Stellaris-Test -debug_mode` direkt geprüft; auch dort blieben Engine-Dateien aus. Diagnosevarianten mit `-windowed`, abschließendem Pfadtrenner und `-gdpr-compliant`, ohne `-debug_mode` sowie mit Windows-Pfadtrennern endeten ebenfalls mit `-1073741819`. Diese ersten Versuche dienen der Eingrenzung; die beiden obigen Berichte sind die archivierten Wiederholungen des finalen Harness.

## Tatsächlich geprüft und offen

| Schritt | Ergebnis |
|---|---|
| Installation / Steam-Build erfassen | ausgeführt, siehe Metadaten und EXE-Hash |
| Isolierten Prozess starten / Absturz erfassen | zweimal reproduziert; kein Spielfenster verfügbar |
| Profilnutzung anhand neuer Engine-Logs | **blockiert**, keine neuen Engine-Dateien |
| EPOCH im isolierten Profil laden | **nicht versucht**, Profil-Gate nicht erfüllt |
| Szenario-Erzeugung, eindeutige Kennung, Save/Load | **nicht implementiert / nicht versucht** |
| `-continuelastsave`, native Fortsetzen-Funktion, UI-Laden | **nicht geprüft**; Parameter bleibt für 4.5.4 unbestätigt |
| `observe`, `fast_forward` | **nicht geprüft**, keine Konsole verfügbar |
| KI-Auftrag gegen persönlichen Wächter und Gefecht | **nicht beobachtet** |
| Überlebter nativer KI-Rückzug, lebender Wächter | **nicht beobachtet** |
| 180 Ingame-Tage ohne erneuten Auftrag | **nicht gemessen** |
| Monatsabgleich mit geeigneter Flotte / erneuter Auftrag | **nicht beobachtet** |
| Alter Stand rot, korrigierter Stand wiederholt grün | **nicht ausgeführt**; Startwiederholungen sind kein Regressionstest |

Die frühere [M0-C-Probe](../../../test-mods/m0-c-runtime-probe/) wurde geprüft: Sie liefert Namespace-/Hook-Strukturen, aber kein Stage-IV-Kampfszenario oder vorbereitetes Save. Sie wurde nicht als Engine-Nachweis verwendet. Der vorhandene `test_stellaris_runtime_log.cjs` ist eingebunden; ohne neues `error.log` wird er nicht mit historischen Logs gespeist.

## Validierung und nächster Schritt

`node scripts/test_release_ci.cjs`: alle 13 spielunabhängigen Prüfkommandos bestanden; direkter SteamCMD-Bash-Untertest unter Windows explizit übersprungen. Die 198 Stage-IV-KI-Modellprüfungen belegen keine Engine-Ausführung. `git diff --check`: bestanden.

```powershell
powershell.exe -NoProfile -File .\scripts\test_stage_iv_engine_gate.ps1
```

Negativtests bestanden: fehlende Installation ergibt Exit 3 und einen frischen Bericht; fremde alte Logs werden ignoriert; ein Testpfad im regulären Profil wird vor dem Schreiben abgewiesen. Kein Spielstart in diesen Negativtests; Fixtures bleiben unter dem ausgegebenen Temp-Pfad.

**Konkreter nächster Schritt:** Den nativen Startabsturz desselben EXE-Hashes mit leerem Testprofil anhand eines lokalen Crash-Stacks eingrenzen und beheben. Danach muss der Gate frische `system.log` und `setup.log` im zugewiesenen Profil erzeugen. Erst anschließend EPOCH aktivieren und die Szenario-Erzeugung mit zwei Reichen, eindeutiger Laufkennung und passiver Auftrags-/Kampf-/Rückzugs-/Monatsbeobachtung implementieren. Synthetische Rückzugsereignisse oder manuell beendete Cooldowns zählen nicht als produktiver Engine-Nachweis. Erforderlich bleiben der fehlerhafte Basislauf und mindestens zwei korrigierte Läufe mit vollständiger 180-Tage-Beobachtung.

Es wird kein vorbereiteter Spielstand oder manuelles Spiel vom Nutzer verlangt. Kein Workshop-Upload, keine Änderung produktiver Mod-Dateien. Testhilfen liegen unter `scripts/` und `docs/`, außerhalb des Workshop-Pakets.
