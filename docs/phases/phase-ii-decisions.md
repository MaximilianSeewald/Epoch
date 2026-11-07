# Stage II Design Decisions and Open Questions

**Status: Binding principles plus explicitly open implementation design.** This document replaces the old mandatory four-ending contract.

## Settled

- Stage II has exactly five chapters; Chapter 5 concludes the stage.
- Progress requires actual actions and recorded outcomes, not only time or event clicks.
- Each empire is isolated; ownership/scope is checked; vanilla remains intact.
- Real projects, science ships, hostile fleets, planetary feature effects, and economic costs are required where the chapter contract calls for them.
- Stage I outcomes matter. Failures have consequences and a recovery route. Permanent voluntary exit is preserved.
- Stage III owns the larger military crisis. Stage IV owns the larger ascension revelation and the Resonance Chamber/countermark culmination under the current mapping.

## Open before implementation

1. How to record project/encounter results with save/load-safe, empire-local state.
2. How to scale Chapter 2's real fleet and its alternative actions across empire strength and game year.
3. Exact project targets, eligible scientist/ship rules, costs, durations, and cancellation/retry behavior.
4. Chapter 4's actual planet-action interface and distinct mechanics for quarantine/research/exploitation/failure.
5. Numeric direct effects on economy/stability and valid transition behavior for existing features.
6. Chapter 5's target-selection/marking mechanism and archive substitute when systems are inaccessible.
7. Stage III handoff fields and compatibility behavior for saves from the current prototype.

Do not inherit the old 0–100 stability assumptions, thresholds, `epoch_ii_*` outcome flags, Chamber outcomes, or the four named endings as requirements without a fresh design decision.
