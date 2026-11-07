# EPOCH – A New Galactic Age

**Stellaris 4.5.3 · English and German · Optional Gigastructures compatibility**

EPOCH is a four-stage narrative campaign for organic empires, Hive Minds, and Machine Intelligences. It adds no start origin, civic, or free bonus.

## Current design

- **Stage I – First Contact:** five connected sections; the current in-game campaign has been tested through entry to Stage II.
- **Stage II – Resonance:** exactly five chapters, starting about five in-game years after the Stage-I continuation decision. Implemented for acceptance: eight required staffed-ship investigations, a mandatory real military victory, seven planet containment actions, and three network systems.
- **Stage III – Military Crisis:** a distinct, larger crisis using real fleets, battles, and strategic alternatives.
- **Stage IV – Ascension:** class-specific, lasting ascension systems, earned healing, and the wider revelation/UAP.

Read the [binding architecture](docs/architecture.md), [stage specifications](docs/phases/), [technical contract](docs/technical-contract.md), [acceptance criteria](docs/testing.md), and [code migration matrix](docs/architecture/content-migration.md). The Chamber and Countermark are not Stage II content and their later use remains undecided.

Stage II gameplay is rebuilt in `common/` and `events/`; its engine behavior, AI, balance, save/load and multiplayer remain untested in game. Run the static regressions and then the connected acceptance run in `docs/testing.md`. Prototype Stage-II saves are explicitly suspended; Stage-I and pre-entry saves remain supported. Gigastructures remains an optional, separately validated integration.
