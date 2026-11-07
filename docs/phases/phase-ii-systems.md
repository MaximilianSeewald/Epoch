# Stage II System Contracts

**Status: Binding requirements; detailed implementation choices remain open.** This file defines system behavior for the five chapters in [Stage II – Resonance](phase-ii-resonance.md). The prototype inventory is in [Content Migration](../architecture/content-migration.md).

## Empire campaign record

Store campaign state per eligible empire. Stage transitions validate current owner, stage, and referenced game objects. Save/load must resume without duplicate rewards or dispatch. Missing, captured, or destroyed objects invoke the chapter's documented fallback. Each empire proceeds independently.

## Planetary feature foundation

Use the shared feature families from Stage I/PR #11: Resonance Contamination, Resonance Scar, and Silent Structure. At most one visible state from each family may exist per planet. These are not manually clearable. State changes replace the prior state in the same family. Each visible state has a real, class-compatible economic effect. Stage II incidents must use and update these states rather than introduce a competing modifier-only state model or duplicate marker. Exact Chapter 4 transitions/effects are an open design decision.

## Science and analysis

Every required investigation has a valid native Special Project or a specified paid alternative. Define valid target scope, science participation, costs, completion/failure/cancellation callback, persistent result, and unavailable-target recovery. Chapter 3 starts research opportunities without auto-awarding technologies. Chapter 5 requires multiple real systems/projects.

## Fleet and military objects

Chapter 2's Nullwardens are an actual hostile fleet in a real star system. Define ownership/hostility, fleet creation and cleanup, targeting, combat resolution, AI processing, and recorded outcome. Alternative routes must also change game state. No event-only image or abstract meter satisfies the encounter. The adapted larger threat is Stage III scope.

## Planetary containment

Chapter 4 responds to real planet features and conditions. Quarantine, research, exploitation, and failure differ in action, cost, and persistent consequence. Economy, stability, and feature family state are directly affected. Preserve at least one recoverable path after failure. Details require a later mechanics design.

## Localisation, UI, and verification

Provide complete English/German player-facing strings, native visible resource costs when supported, and usable Vanilla or original graphics. Validate actual UI placement/refresh and economics in game. Keep static checks, source findings, and in-game results separately labeled. Save/load and multiplayer desync validation are mandatory gates.
