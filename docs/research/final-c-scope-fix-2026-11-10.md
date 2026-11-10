# Finaler C-Scope-Fix — 2026-11-10

Basis: `bec484a85f4dec226905a7d746bc1fcb83fcd981`, Branch `codex/stage-iv-package-c`.
Der Spieler bestätigt auf dieser Basis Gebäude, Bau, reale Fabrik-/Megastrukturproduktion, Ressourcenanzeige, Forschung, Komponenten, Traditionen und Perks. Diese gezielte Korrektur betrifft ausschließlich elf passive Reichsmodifier und ihre Tests. Frühere Aussagen, Modifier-Potentials liefen grundsätzlich im Country-Scope, sind durch die aktuelle Engine-Diagnostik überholt.

## Quellen und Scope-Entscheidung

- Installierte Version: `G:/Steam/steamapps/common/Stellaris/launcher-settings.json:3`, `Cygnus v4.5.3 (4e91)`. SHA-256: `65f9b547c0d5194f885ec015ff46edba941d45e78706b5a92efb03d079fa07e9`.
- Vanilla `G:/Steam/steamapps/common/Stellaris/common/megastructures/22_shroud_seal.txt:36–53`: beide `triggered_country_modifier.potential` verwenden `owner?`, für `has_relic` bzw. `has_technology`. SHA-256 der Datei: `08d1112ae898d68d33ce5a509f657e886cfb7085dae199e81cde80cd52983a5b`.
- Aktuelles echtes `Documents/Paradox Interactive/Stellaris/logs/error.log`, Lauf 18:55:33: für alle elf Basiszeilen 38, 67, 96, 233, 234, 264, 265, 295, 296, 326, 327 steht `Current Scope: megastructure`, `Supported Scopes: country`. Die relevanten Meldungen sind unverändert, pro Trigger/Zeile dedupliziert, in [final-c-scope-errors-2026-11-10.txt](final-c-scope-errors-2026-11-10.txt) gesichert.
- Generierte Engine-Dokumentation `logs/script_documentation/triggers.log`: `has_megastructure_flag` unterstützt Megastructure; Country-Prädikate einschließlich der rekursiv aufgelösten EPOCH-Trigger werden vom Validator gegen ihre dokumentierten Scopes geprüft.

`potential` läuft an der konkreten Megastruktur. Dort liegen `has_megastructure_flag = epoch_c_operational` und `exists = owner`. `owner?` wechselt zum aktuellen Country; dort liegen persönliche Freischaltung, Philosophie, Technologie und das bestehende Nexus-/UAP-Familienlimit. `owner` ist ebenfalls ein gültiger Scope-Wechsel an einer besessenen Megastruktur; verwendet wird das installierte optionale Vanilla-Muster `owner?`, mit zusätzlichem explizitem Existenztest für besitzerlose Instanzen. Objektflags gehören nicht innerhalb dieses Country-Blocks.

Der vorherige Suchlauf über `any_owned_megastructure` entfällt hier: Abschluss muss an dieser Instanz feststehen. Die unveränderten Abschluss-/Upgrade-Callbacks setzen das operative Flag an `fromfrom`. Jede Stufe trägt nur ihren bestehenden Bonus. Das bestehende Country-Limit deaktiviert Boni bei mehreren Anlagen derselben limitierten Familie. Besitzerwechsel fragt ausschließlich den neuen Besitzer ab; keine gespeicherten Besitzerziele oder dauerhaft vergebenen Reichsmodifier. UAP prüft weiterhin genau einen persönlichen Philosophiepfad und dessen Technologie.

## Regressionen

Befehl: `pwsh -NoProfile -File scripts/test_epoch_regressions.ps1 -LogDirectory docs/research/no-fresh-runtime-log` — Exit 0. Der bewusst nicht vorhandene Logpfad verhindert, dass alte Laufzeitdiagnostik als Prüfung des neuen Commits erscheint.

- 715 Hauptprüfungen erfolgreich, 74 Clausewitz-Dateien geparst.
- 567 C-Runtime-Verträge erfolgreich: elf originale fehlerhafte Potentials aus dem exakten Basiscommit müssen im Megastructure-Scope scheitern; pro korrigiertem Modifier scheitern auch Mutationen mit ausgepackten Country-Bedingungen bzw. Country-seitigem Objektflag. Installierte Vanilla-Potentials werden mit demselben Scope-Validator geprüft.
- 2.703 C-Assertions erfolgreich: alle Stufen und beide Philosophien, fertige/unfertige Instanzen, besitzerlose Strukturen, persönliche Freischaltung, Eignung, relevante Technologie, Eroberung durch unqualifizierten bzw. qualifizierten Besitzer mit anderer Philosophie, Familien-Duplikate und widersprüchliche Philosophieflags.
- AST-Vergleich gegen `bec484a`: sämtliche Nicht-Modifier-Felder einschließlich vollständiger `resources.produces`-Definitionen unverändert; Bonuswerte und Anzahl der Modifier ebenfalls unverändert. Fabriken, Kern-Unterhalt, Kosten, Bauabläufe, Story und Balance unverändert.
- Bestehende B-, Produktions-, Scope-, Story- und Erhaltungsprüfungen im Gesamtlauf erfolgreich.

Statische Prüfungen ersetzen keine Engine-Ausführung des neuen Commits. Anschließend genügt die gezielte reale Bestätigung: frische `error.log` ohne EPOCH-Scope-Fehler, aktiver Nexus-Stabilitätsbonus, aktiver UAP-Philosophiebonus und weiterhin die bereits bestätigte Produktion.

PR #18 bleibt unverändert. PR #19 bleibt Draft und ungemergt. Kein neues Arbeitspaket.
