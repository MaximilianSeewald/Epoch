# Phase I: vollständige Ingame-Abnahme

Stand: 6. November 2026. Branch `feature/first-playable-discovery`, PR #6.
Die Implementierung ist für diese Abnahme vorbereitet. Die statischen Prüfungen
sind kein Nachweis eines erfolgreichen Spieldurchlaufs.

## Vorbereitung

Stellaris 4.5.3, zunächst nur EPOCH Core, neues Spiel oder Spielstand vor der
Entdeckung verwenden. Bereits mit der alten Stagefolge übersprungene Abschnitte
werden nicht automatisch nachgeholt. Mindestens zwei Wissenschaftsschiffe mit
wissenschaftlicher Leitung bereithalten. Eines wird beim Expeditionsprojekt
verloren gehen. Für die Eindämmungsalternative 500 Energie und 300 Mineralien
zurücklegen. Alte Logs vor dem Start archivieren, danach ausschließlich frische
`error.log`-/`game.log`-Einträge bewerten.

## Ein vollständiger Durchlauf

1. Durch reguläre Erkundung das erste Echo entdecken und eine Untersuchungsmethode
   wählen. Der Fortschritt steigt monatlich bis zur Echo-Warte-Stage bei 15.
   Ein Monatswert darf die Schwelle leicht überschreiten, aber niemals die
   Warte-Stage verlassen. Genau ein erstes Projekt wird angeboten.
2. Zwei Monate ohne Projektabschluss verstreichen lassen: kein Fortschritt,
   kein zweites Projekt und keine Expedition. Erstes Projekt abschließen,
   Folgeentscheidung treffen, zweites Projekt abschließen. Vorher und nachher
   speichern/laden; keine doppelten Projekte oder Ereignisse.
3. Die Analyse bis 25 laufen lassen. In der Expeditions-Warte-Stage die
   Entsendung genehmigen und bewusst ein bestimmtes Wissenschaftsschiff zuweisen.
   Nur dieses Schiff darf bei Projektabschluss verschwinden. Rettung, Bergung
   oder Fernvermessung wählen und abschließen; das Suchschiff bleibt erhalten.
   Den Ergebnisbericht bestätigen. Vorher darf kein Kontaminationsereignis starten.
4. Bis 35 analysieren. Die betroffene Welt muss einen reichsspezifischen
   Kontaminationsmodifikator erhalten. Probenprojekt wählen und mehrere Monate
   offenlassen: kein Fortschritt und keine Ausgrabung. Eindämmungsansatz zeitweise
   wählen: Kosten und Puffer prüfen, anschließend zurückwechseln. Probenprojekt
   abschließen; eine abgeschwächte dauerhafte Spur bleibt bestehen.
5. Bis 45 analysieren. Die Ausgrabung ausdrücklich genehmigen und ein
   Wissenschaftsschiff am Fundort einsetzen. Alle vier archäologischen Kapitel
   durchspielen. Kein Zeitablauf darf die Ausgrabung abschließen. Nach Kapitel 2
   speichern/laden. Erst die Entscheidung in Kapitel 4 löst die Sperre.
   Kammer sichern, zerstören oder untersuchen; den jeweiligen Modifikator und
   den Erhalt beziehungsweise die Entfernung des Fundorts prüfen.
6. Bis 55 analysieren. Der Abschlussbericht muss die tatsächlichen Echo-,
   Expeditions-, Kontaminations- und Strukturergebnisse widerspiegeln. Zwei Monate
   ohne finale Wahl warten: Situation bleibt stehen. Eine der beiden finalen
   Entscheidungen treffen: Situation verschwindet sofort, dauerhafte Schäden
   bleiben bestehen. Speichern/laden und mehrere Monate weiterlaufen lassen.
   Bei versiegelten Aufzeichnungen darf keine erneute EPOCH-Untersuchung starten.

Während jeder offenen Pflichtaufgabe bleiben normale Ansatzkosten und
Forschungsboni gemeinsam ausgesetzt. Der Eindämmungsansatz kostet während der
Kontaminationsuntersuchung weiter und bietet seinen Gesellschaftsbonus; sein
planetarer Puffer endet mit der Auflösung. Nach Verlassen dieses Abschnitts muss
automatisch ein gültiger Ansatz gewählt werden.

## Alternativen über Sicherungsstände prüfen

Diese Zweige gehören zur selben Abnahme und benötigen keinen vollständigen
Neustart für jeden Pfad:

- Echo: andere Einstiegsmethode; Kalibrierung/Vergleichsbasis beziehungsweise
  Overdrive/Drosselung. Ein Projekt abbrechen: genau ein Wiederholungs-/Abbruchfenster.
  Erste Untersuchung endgültig schließen beendet die Untersuchung; expliziter
  Abbruch der zweiten Untersuchung erlaubt die Expedition ohne Forschungsbelohnung.
- Expedition: Rückruf vor Projektabschluss darf kein Schiff und keine Leitung
  entfernen. Suchprojekt abbrechen und wiederholen oder endgültig aufgeben.
  Rettung kann scheitern; Bergung und Fernvermessung retten nicht automatisch die
  Leitung. Verluste wirken auf spätere Schäden.
- Kontamination: kostenpflichtige Isolation entfernt aktive Schäden; bewusstes
  Ignorieren verschlimmert sie und kann eine zweite eigene Welt treffen.
  Gescheitertes Probenprojekt verlangt Wiederholung oder ausdrücklichen Abschluss.
  Keine Variante verschwindet allein durch Zeitablauf.
- Struktur: verlorene/eroberte Zielwelt oder entfernte Ausgrabungsstätte öffnet
  genau eine Fernanalyse-/Archiventscheidung. Auch die Fernanalyse kann abgebrochen
  und wiederholt oder ausdrücklich geschlossen werden.
- Abschluss: beide Entscheidungen aus demselben Sicherungsstand prüfen.
  Versiegelung sperrt weitere Teilnahme dauerhaft; Fortsetzung bewahrt nur den
  Bereitschaftszustand für spätere Inhalte. Phase II startet noch nicht.

## Abnahmekriterien und Reichsvarianten

Keine übersprungenen Abschnitte, doppelten Projekte, technischen Textschlüssel
oder neuen EPOCH-Scope-/Parserfehler. Dauerhafte Modifikatoren und Entscheidungen
müssen Save/Load überstehen. Den Ablauf anschließend mit Maschinen- und
Schwarmreich sowie englischer Lokalisierung gegenprüfen. KI-Projektzuweisung und
vollständiger KI-Abschluss sowie zwei gleichzeitig aktive Reiche benötigen eine
eigene Laufzeitbeobachtung; Host/Client-Synchronität bleibt ein Release-Test.

Optional `event epoch_core.49` zum Ein-/Ausschalten des Diagnosemodus verwenden.
Er ist standardmäßig aus. Keine anderen Konsolenbefehle sind für den regulären
Abnahmedurchlauf erforderlich. PR #6 bleibt bis zur erfolgreichen Abnahme offen
und ungemergt.
