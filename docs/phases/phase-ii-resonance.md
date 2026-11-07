# Stage II – Resonance

**Status: Binding design specification.** Exactly five chapters. This contract authorizes design alignment only; it is not evidence that Stage II gameplay has been implemented or tested. See [migration plan](../architecture/content-migration.md) before a code change.

## Purpose and continuity

The old signal returns, the empire discovers that the Stage I scar and distant systems share a pattern, and the empire learns the Nullwardens are involved in suppressing it. Stage II resolves its immediate investigation and hands the military escalation to Stage III. It does not reveal the origin or universal purpose of the network, activate a Resonance Chamber finale, introduce a Countermark ending, or reveal the Universal Ascension Protocol.

Every continuing empire owns an independent campaign record. Preserve its Stage I choices, science/archaeology outcomes, contamination result and site, Silent Structure result, permanent scar/consequences, and continuation/exit decision. The permanent voluntary exit remains effective. Planet states remain attached to their actual worlds and are not silently cleared or copied. If a target is lost, destroyed, captured, or inaccessible, use a documented archive, remote observation, or costly fallback; never redirect an effect to an unrelated world. Do not allow one empire's target or progress to be read or changed by another.

## Chapter contract

### 1. The Scar Wakes

The old signal returns. Investigation uses a real Science Ship project with a valid target, scientific participation, and a recorded result, or a clearly described paid alternative for unavailable ships/sites. Stage I outcomes change risk, findings, and economic consequences. Completion follows the investigation and a player decision, not elapsed time.

### 2. The First Hunters

Introduce a real hostile Nullwarden fleet in a star system. It must exist as a military game object and be processed by Stellaris combat/AI systems. Valid outcomes include military victory, active diversion, prepared defense, and costly withdrawal. Each route records actual durable results; neither a popup nor time passage completes the chapter. Combat balance and fallback costs remain open until implemented and tested.

### 3. The Broken Code

Analyze wreckage, sensor traces, or replacement archives through research projects with valid targets, science participation, and observable outcomes. Begin useful research paths without granting technologies automatically. Losing a target changes the route/reward, not the ability to proceed.

### 4. The Second Infection

Provide playable planetary containment that reacts to actual conditions and the shared Stage I Planetary Features. Quarantine, research, exploitation, and failure must have distinct mechanics. They affect economy, stability, and current planetary feature state directly. A failure may leave a permanent consequence but must leave an actionable recovery path; it must not softlock Stage II.

### 5. The Network of Silence

Explore multiple actual star systems with concrete marked targets and real Science Ship projects. Branch choices over silent systems, suppressed signals, and the network reflect earlier decisions and change findings/risks. Resolve the Stage II investigation and create a narrative and mechanical transition record for Stage III. Chapter 5 is the end of Stage II: there is no further Stage II chapter, finale, or required ending choice.

## Shared requirements

All five chapters use actual player actions and persistent outcomes. Time can schedule an opportunity but cannot substitute for its objective. Projects require valid targets and science participation. Missing targets and project cancellation have explicit recovery. Player and AI routes share eligibility, costs, and meaningful outcomes. Tests must cover organic, Hive Mind, and Machine Intelligence empires; two independent campaigns; save/load; host/client multiplayer; and English/German text. Resource effects appear in native tooltips where the engine supports them. No runtime-success claim may derive from static checks alone.

## Open design decisions

The precise battle scale and fleet composition; project names/costs; chapter transition storage; exact incident cadence; feature-state-to-economy values; containment action menu; and Chapter 5 exit outcomes require implementation design. Do not treat old thresholds, flags, four Block C endings, or prototype cadence as settled. Resolve each in the code PR specification and test plan before implementation.
