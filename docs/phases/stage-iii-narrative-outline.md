# Stage III – Narrative Outline / Story Bible Extension

> **Current contract, 2026-11-09:** The post-playtest implementation request supersedes the opening-only scope and earlier pre-implementation approval gates. The connected five-chapter campaign is implemented for static review; new gameplay has **not** been run in Stellaris. The user's first test confirms only the previous opening at `b421408`. All resolution variants now require destruction of every registered fortified node, the unique command ship in actual combat, and surviving hostile formations. Science weakens logistics and combat; it never withdraws, deletes or automatically defeats the command formation. Cooperation uses this same military validator. See [current implementation](stage-iii-full-implementation.md).


**Status: binding tone and story beats, not actual localization or verified dialogue.** Working stage title: **The Nullwarden Convergence / Die Konvergenz der Nullwächter**. The term 'convergence' may be an in-world scientific conjecture, never a prematurely proven explanation. Follow existing `docs/story-bible.md` and the Stage-I/II narrative/UI review.

## The information boundary

The audience knows from Stage II that one Nullwarden flotilla attacked, anomalous signals recur, three remote sites held distinct fragments of a coordinated network, and planetary damage persisted. They **do not** know the maker, the full objective, or whether the Nullwardens protect or suppress something worse. The Stage-III events should create observations that could support several theories without selecting one as truth.

A galaxy whose empires never completed EPOCH must encounter the same physical threat without invented memories of the first expedition, scar survey, early Nullwarden battle, or silent network projects. Global public messages use neutral evidence; veteran country-local messages may reference its actual past decisions. Never present an opted-out empire as having willingly resumed its old personal investigation.

## Recurring motifs

- **Silence with structure:** radio gaps appear *in regular intervals*, too precise to be empty noise.
- **Wrong corrections:** alien systems modify their own orders midway through actions, hinting at obsolete or conflicted instructions.
- **Echoes of Stage I:** rescued expedition recordings, Contamination, Scar and Silent Structure can provide familiar but incomplete parallels.
- **The planet does not forget:** old physical feature states remain and later hazards react differently to damaged, healed or quarantined worlds.
- **Military uncertainty:** ships can be hostile yet defensive around certain real sites; retreat can be an intentional part of enemy doctrine, not proof of peace.
- **No future spoilers:** an encounter reports what observers can know *now*, not the next chapter, fleet composition or expected reward.

## Chapter beats and sample in-world excerpts

### I. Die Gegenantwort — sensing the absence

Early participants (only if qualified) receive ambiguous records in the preparation window. The report should not describe a future invasion. An uninitiated empire receives nothing until the public crisis begins.

Sample: *„Die Messstation meldete keinen Ausfall. Sie hat gesendet, als wäre eine Antwort eingetroffen — doch niemand kann sagen, von wem.“*

When M arrives, all spacefaring empires receive a neutral galactic report, with no reference to earlier EPOCH branches they may never have played.

### II. Die schweigenden Grenzen — the first forbidden corridor

A Nullwarden force crosses a real frontier. Keep details grounded in observed fleet positions, communications and damaged objects. No claim that their goal is conquest unless they actually occupy systems.

Sample: *„Drei Außenposten haben dieselbe Meldung abgesetzt. Der vierte schwieg. Auf seiner Sternenkarte fehlt nun eine Route, die seit Jahrhunderten verzeichnet ist.“*

### III. Die drei Brennpunkte — three functions, incomplete understanding

Different empires can observe different fronts and infer a pattern from the shared state. The story never calls a station a 'spawn source', 'modifier carrier' or 'quest gate'.

Sample: *„Auf den Aufzeichnungen liegen drei getrennte Rhythmen. Einer beantwortet Fragen, die niemand gestellt hat. Einer bricht jede Antwort ab. Der dritte zählt weiter.“*

### IV. Die Konvergenz — an order without words

The command formation is introduced by real sensor contact. Choice and strategic action determine the next discovery, not prewritten future summaries.

Sample: *„Die Schiffe wechselten gleichzeitig den Kurs. Keines empfing einen Befehl, den unsere Antennen erkennen konnten. Und doch warteten sie alle auf denselben Augenblick.“*

### V. Der letzte Befehl — a military ending, not the final revelation

The ending reflects the actual path: destroyed command ship, interrupted relays, or allied efforts. It acknowledges losses and damage without promising free repairs. It deliberately preserves an uncertain clue for Stage IV.

Sample: *„Das Signal war verstummt. Erst als die Trümmer den Stern hinter sich verdeckten, bemerkten unsere Sensoren, dass etwas anderes weiterzählte.“*

## Perspective matrix

| Perspective | Focus | Do not do |
|---|---|---|
| Biological empire | Crew reports, civilian panic/solidarity, competing scientists, industrial choices | Assume all citizens have the same psychology |
| Hive Mind | Divergence in shared sensation, contaminated drones and coordinated response | Describe independent drone voting as normal |
| Machine Intelligence | Irreconcilable instructions, synchronization errors, audited command chains | Suggest immunity from electronic/biological-system effects |
| Stage-I/II veteran | Real references to whichever ship, structure, infection outcome and risky study occurred | Grant unearned knowledge in unrelated branches |
| Uninitiated | Initial disbelief followed by actual observation, generic defensive science | Pretend it joined the old expedition |
| Permanently opted out | Neutral public alerts and physical danger; no personal invitation to the forbidden investigation | Reopen the abandoned personal story or reveal hidden outcomes |

## Player-facing UI rules

Events provide literary discoveries, immediate choices and consequences already observable. Costs, actual research, devastation and modifiers appear in native UI. A project's description defines its *current* investigation, never the next enemy or a staged quest list. A global Situation may reflect the current fleet/anchor threat, but does not recite design documentation. Existing EN/DE choices must be idiomatic, not word-for-word literal. No player-visible 'Stage', 'EPOCH mod', 'handoff', 'callback', 'scripted effect', 'flag', 'variable', 'recovery' or hidden event IDs.

## Stage-IV boundary

Stage III's last recovered fragment is deliberately insufficient to determine the Architects' identity or the Universal Ascension Protocol. Personal entry to Stage IV remains conditional on earlier choice and future earned prerequisites, not the global crisis result alone.

## Integration boundary

[ADR-002](../architecture/adr-002-stage-iii-integration.md) governs actual capabilities. In the version-1 baseline, report physical raids, battles and planetary hazards; do not claim ground occupation, capturable bases or forced ownership changes without their separate native proof. Global military phase and local discovered knowledge remain distinct. Public defensive agency after M does not fabricate Stage-II history or reopening of private missions.
