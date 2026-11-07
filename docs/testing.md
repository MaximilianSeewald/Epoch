# EPOCH Testing Policy

**Status: Binding.** Active test scope follows the [four-stage roadmap](roadmap.md) and stage contracts. Historical test reports preserve what was observed at that time; they do not override current requirements.

## Evidence levels

- **Design:** requirement or proposed behavior only.
- **Source-verified:** pattern exists in inspected game files; no claim of EPOCH runtime correctness.
- **Static regression:** source structure/invariants checked; no claim of engine execution.
- **In-game verified:** reproducible test on a recorded Stellaris build, mod revision, save, route, and logs.

Do not upgrade an evidence claim without new evidence. In particular, the current Stage I run reached entry into Stage II; it does not establish complete multiplayer, AI, or alternate-path validation.

## Required coverage by implementation stage

- Stage I: five-section story, real projects and archaeology, permanent consequences/exit, and shared planetary feature family behavior. Use [Stage I acceptance](testing/phase-i-acceptance.md).
- Stage II: exactly five chapters with real objectives, real fleet in Chapter 2, planetary containment in Chapter 4, multi-system science work in Chapter 5, and no progress from time alone. Use [Stage II acceptance](testing/phase-ii-full-acceptance.md).
- Stage III: real military objects/combat, alternative strategy, system/planet consequences, and prior-choice adaptation.
- Stage IV: earned ascension/healing, differentiated empire-class paths, real research/traditions/perks/infrastructure, and durable world/economy/military changes.
- Cross-stage: organic/Hive/Machine; AI/player; concurrent empires; target ownership/scope; fresh and migrated saves; save/load; MP host/client; Vanilla and optional-mod conditions; English/German; UI/tooltips/art; fresh logs.

## Pass criteria

The stage-specific objectives, recovery routes, and durable effects pass in game on recorded builds. Static tests and scripts remain valuable regression checks but cannot substitute for the game. Record exact routes, checkpoints, screenshots where UI matters, and `game.log`/`error.log` findings. A test plan or a pre-merge checklist is not itself a completed test report.

## Historical artifacts

`testing/m0-c-runtime-test.md`, M0 evidence, PR #11 review notes, and former Stage II block acceptance files document specific earlier revisions. Keep those results historically accurate. When a historical test expectation conflicts with the new architecture, use the current stage acceptance contract and mark the old expectation superseded.
