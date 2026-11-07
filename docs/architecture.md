# EPOCH Architecture Contract

**Status: Binding current architecture.** For conflicts use the hierarchy in [Content Migration](architecture/content-migration.md). Historical records and code inventory are evidence, not active design.

## Campaign shape

EPOCH has exactly four stages: **I – First Contact**, **II – Resonance**, **III – Military Crisis**, and **IV – Ascension**. Stage I retains its five sections. Stage II contains exactly **The Scar Wakes**, **The First Hunters**, **The Broken Code**, **The Second Infection**, and **The Network of Silence**. Stage III is the larger military crisis. Stage IV is ascension. The binding details and boundaries are in each stage specification linked from the [roadmap](roadmap.md). No older six-stage outline or eight-chapter Stage II is active.

## Cross-stage invariants

- No new start origin, civics, free start bonuses, or start technology. Discovery begins through delayed events and discoveries.
- Support regular organic empires, Hive Minds, and Machine Intelligences. Empires participate independently; no global singleton blocks a competing empire.
- Keep vanilla content functional. Gigastructures remains optional in a separate integration.
- Validate ownership and scope before accessing foreign event targets.
- Use actual game objects and player actions for ships, fleets, projects, research, buildings, planetary conditions, and costs. Time may pace opportunities but may not substitute for required gameplay.
- Keep durable consequences and voluntary permanent exit. Failure paths must not create an unresolvable softlock.
- Show resource impacts in native option tooltips where the engine supports it. Localize all player-facing text in English and German and use suitable vanilla or original art.
- Treat save/load and multiplayer safety as requirements. State only the evidence level actually obtained: design, source inspection, static checks, or reproducible in-game verification.

## Ownership and progression

Campaign records are empire-local. A campaign transition must preserve the relevant prior decisions and outcomes, revalidate the owner and any referenced objects, and have a recoverable path for missing/destroyed objects. Stage specifications define narrative requirements; the next implementation design must resolve detailed mechanics where marked open rather than infer them from the old prototype.

## Stage boundaries

Stage I implementation and tested scope are described in [First Contact](phases/phase-i-first-contact.md); Stage I conclusions and planetary foundations are recorded in [PR #11 evidence](pr-11-core-gameplay-ui.md). Stage II ends after its fifth chapter and hands off to Stage III. Adapted Nullwardens, a larger convergence threat, and the full military escalation belong to Stage III. The Universal Ascension Protocol reveal and earned recovery of accumulated EPOCH harm belong to Stage IV. The Resonance Chamber and Countermark are retired from Stage II; their future placement and function are open design decisions, with Stage IV only a candidate.

## Technical references

The engine source reference, ADRs, and implementation reports retain milestone-specific evidence. They do not establish runtime, AI, save/load, or multiplayer behavior unless a reproducible test is recorded. See [technical reference](technical-reference.md), [testing policy](testing.md), and the [migration register](architecture/content-migration.md).
