# EPOCH – A New Galactic Age

**Stellaris 4.5.3 · English and German · Optional Gigastructures compatibility**

EPOCH is a four-stage narrative campaign for organic empires, Hive Minds, and Machine Intelligences. It adds no start origin, civic, or free bonus.

## Current design

- **Stage I – First Contact:** five connected sections; the current in-game campaign has been tested through entry to Stage II.
- **Stage II – Resonance:** exactly five chapters, starting about five in-game years after the Stage-I continuation decision. Implemented for acceptance: eight required staffed-ship investigations, a mandatory real military victory, seven planet containment actions, and three network systems.
- **Stage III – The Nullwarden Convergence:** five globally synchronized chapters with 2–4 military fronts, planetary contamination and a unique command ship. The third connected player test was reported successful, including visible stations and military completion. Final corrections prevent duplicate finale reports, add rare bounded transmission, simplify DE/EN tooltips, moderately strengthen weapons and fix species/withdrawal script errors. See [third-playtest corrections and evidence limits](docs/phases/stage-iii-third-playtest.md).
- **Stage IV – Ascension:** [approved planning baseline, not implemented](docs/phases/stage-iv-ascension.md): six personal chapters, earned healing, a personal Leviathan, and 42 technologies with class-specific ascension systems and the final Architects/UAP revelation. See [work packages A–D](docs/phases/stage-iv-work-packages.md) and [technical feasibility and limits](docs/phases/stage-iv-technical-feasibility.md). Development continues within one EPOCH mod.

Read the [binding architecture](docs/architecture.md), [stage specifications](docs/phases/), [technical contract](docs/technical-contract.md), [acceptance criteria](docs/testing.md), and [code migration matrix](docs/architecture/content-migration.md). The Chamber and Countermark are not Stage II content and their later use remains undecided.

Stage II gameplay is rebuilt in `common/` and `events/`; its main player route was reported accepted on 2026-11-08, while independent AI, alternative-path, balance, save/load and multiplayer evidence remains limited. Run the static regressions and then the connected acceptance run in `docs/testing.md`. Prototype Stage-II saves are explicitly suspended; Stage-I and pre-entry saves remain supported. Gigastructures remains an optional, separately validated integration.

## Stage-III acceptance

The player reports a successful third connected Stage-III test. The [final correction report](docs/phases/stage-iii-third-playtest.md) records the subsequent changes and targeted static checks. A further full player acceptance run is not required for these corrections. Their new runtime behavior and multiplayer have not been independently verified. The [engine contract](docs/phases/stage-iii-engine-contract.md) and [acceptance matrix](docs/phases/stage-iii-acceptance.md) remain technical references; earlier pending-test statements describe historical evidence. Existing Stages I/II remain unchanged.
