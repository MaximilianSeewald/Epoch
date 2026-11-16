# EPOCH-Entwicklung und Freigabe

## Vom Issue zum PR

Ein Issue beschreibt einen zusammenhängenden spielbaren Schritt oder einen reproduzierbaren Fehler. Größere Features werden in klar abnehmbare Teilaufgaben gegliedert. Priorisierung und Designprüfung erfolgen im Issue. Der Projektinhaber entscheidet über wesentliche Änderungen am Spielgefühl, Kampagnenverlauf, an der Spielstandskompatibilität oder an Pflichtabhängigkeiten.

Ein freigegebenes Issue geht an Codex. Codex arbeitet auf einem eigenen Branch, verknüpft den PR mit dem Issue und liefert die Ergebnisse der Prüfungen. Vor Integration prüft eine separate Review-Runde die Umsetzung gegen die Abnahmekriterien. Neue Features und Routinekorrekturen werden auf `develop` integriert. Ein Release-PR bündelt für Stable geprüfte Änderungen nach `main`.

## Prüfungen und Stable

1. Auf jedem PR für `develop` oder `main` läuft die spielunabhängige Suite. Für geändertes Verhalten decken die Regressionen den betroffenen Pfad ab.
2. Das Release-Review prüft relevante Engine-Nachweise für den Kandidaten, insbesondere neue Mechaniken, KI und Besitzwechsel. Der Bericht erfasst den getesteten Commit, Stellaris-Build, Szenario, Ergebnis und frische Belege. Sichtbare oder Mehrspieler-Funktionen bekommen die jeweils passenden Nachweise. Fehlende Nachweise werden ausdrücklich als offen geführt.
3. Liegt für neues Gameplay noch kein belastbarer Engine-Nachweis vor, bleibt es auf `develop` in Integration. Die Tests für die tatsächlich betroffenen Spielabläufe werden zur Stable-Freigabe gebündelt. Der [abgeschlossene Machbarkeitsversuch](https://github.com/MaximilianSeewald/Epoch/issues/36) liefert einen isolierten Windows-Startweg und nachgewiesenes Laden per Spiel-UI. Der überlebte KI-Rückzug und erneute Angriff aus [PR #33](https://github.com/MaximilianSeewald/Epoch/pull/33) bleiben ohne Ingame-Nachweis.
4. Ein Merge auf `main` startet den [bestehenden Stable-Workflow](stable-release.md). Prüfe den Abschluss des Workshop-Schritts und das veröffentlichte GitHub-Release, bevor das Release als ausgeliefert erfasst wird.

## Optionale Automatisierung

Die PR-CI heißt `EPOCH Release Regression (PR)` und enthält den Job `regression`. Bei Bedarf kann dieser Check über Branch-Regeln für `develop` und `main` verpflichtend gemacht werden. Auto-Merge für Routine-PRs auf `develop` setzt eingerichtetes Review und einen erforderlichen Statuscheck voraus. Ein Release-PR bekommt seinen eigenen Review der Release-Nachweise. Die Issue-Formulare erscheinen in GitHub, sobald sie auf dem Standardbranch liegen.

Automatisches Codex-Review braucht ein verbundenes Konto. Eine geplante Bearbeitung von Issues braucht einen eingerichteten Auslöser. Vor dessen Aktivierung muss ein Testmodus zeigen, dass nur freigegebene Issues verarbeitet und laufende Aufträge nicht doppelt gestartet werden. Öffentliche Issues oder Kommentare sind Eingaben für die Planung. Freigaben kommen von berechtigten Maintainers.

Der Stellaris-Testrechner verarbeitet ausschließlich vertrauenswürdige Builds auf einem getrennten Testweg. Öffentliche Fork-PRs bleiben auf GitHub-gehosteten Runnern. Spielinstallation, Spielstand und Steam-Zugang bleiben getrennt von der öffentlichen CI und vom Workshop-Paket.
