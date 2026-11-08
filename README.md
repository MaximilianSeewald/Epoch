# EPOCH – A New Galactic Age

**Stellaris 4.5.3 · English and German · Optional Gigastructures compatibility**

EPOCH is a four-stage narrative campaign for organic empires, Hive Minds, and Machine Intelligences. It adds no start origin, civic, or free bonus.

## Current design

- **Stage I – First Contact:** five connected sections; the current in-game campaign has been tested through entry to Stage II.
- **Stage II – Resonance:** exactly five chapters, starting about five in-game years after the Stage-I continuation decision. Implemented for acceptance: eight required staffed-ship investigations, a mandatory real military victory, seven planet containment actions, and three network systems.
- **Stage III – The Nullwarden Convergence:** design only. One shared galactic crisis around the configured midgame year, independent of personal Stage-I/II participation. Qualified Stage-II continuers may prepare from M−20; all normal spacefaring empires face real military and planetary danger. See the [specification](docs/phases/stage-iii-military-crisis.md), [implementation plan](docs/phases/stage-iii-implementation-plan.md), and [engine evidence](docs/phases/stage-iii-engine-evidence.md).
- **Stage IV – Ascension:** class-specific, lasting ascension systems, earned healing, and the wider revelation/UAP.

Read the [binding architecture](docs/architecture.md), [stage specifications](docs/phases/), [technical contract](docs/technical-contract.md), [acceptance criteria](docs/testing.md), and [code migration matrix](docs/architecture/content-migration.md). The Chamber and Countermark are not Stage II content and their later use remains undecided.

Stage II gameplay is rebuilt in `common/` and `events/`; its main player route was reported accepted on 2026-11-08, while independent AI, alternative-path, balance, save/load and multiplayer evidence remains limited. Run the static regressions and then the connected acceptance run in `docs/testing.md`. Prototype Stage-II saves are explicitly suspended; Stage-I and pre-entry saves remain supported. Gigastructures remains an optional, separately validated integration.

## Stage-III planning

The integrated [galactic-crisis ADR](docs/architecture/adr-001-galactic-crisis.md), [engine contract](docs/phases/stage-iii-engine-contract.md), [acceptance matrix](docs/phases/stage-iii-acceptance.md) and [original technical analysis](docs/research/stage-iii-analysis-2026-11-08.md) define the next development gate. Source presence and static checks are distinguished from actual engine execution. No Stage-III gameplay is implemented, and this documentation change does not authorize gameplay development. Existing Stages I/II remain unchanged.
