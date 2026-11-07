# EPOCH Architecture

**Status: Binding.** This is the source of truth for campaign-wide rules. Stage details are defined once in the linked specifications; acceptance criteria are in [testing](testing.md), technical evidence and limits in [technical contract](technical-contract.md), and legacy code disposition in the [migration matrix](architecture/content-migration.md).

## Four stages

| Stage | Name | Contract |
|---|---|---|
| I | First Contact | Five sections; implemented, with current in-game evidence through entry to Stage II. See [Stage I](phases/phase-i-first-contact.md). |
| II | Resonance | Exactly five chapters; entry about five in-game years after the Stage-I continuation decision. See [Stage II](phases/phase-ii-resonance.md). |
| III | Military Crisis | Distinct, larger real military escalation. See [Stage III](phases/stage-iii-military-crisis.md). |
| IV | Ascension | Mechanically meaningful ascension and earned healing; the final wider revelation and Universal Ascension Protocol. See [Stage IV](phases/stage-iv-ascension.md). |

Stage II ends with Chapter 5. The Resonance Chamber and Countermark are excluded from Stage II; their later use is undecided. No extra stages or chapters are implied by implementation substeps.

## Cross-stage rules

- Add no origin, start civic, or free starting bonus. First Contact starts through discoveries/events, not a start technology.
- Support organic empires, Hive Minds, and Machine Intelligences with class-appropriate effects and text. Each empire participates independently; no galaxy-global single instance blocks another.
- Validate ownership and scope before accessing event targets. A campaign never reads or changes another empire's objects or progress.
- Use real ships, fleets, science projects, research, buildings, planetary states, and costs. Events present decisions but do not substitute for promised gameplay. Time can pace content but cannot satisfy an objective by itself.
- Keep failure consequential but recoverable; preserve a deliberate, permanent player exit.
- Preserve Vanilla behavior. Stage I's three Planetary Feature families are shared across later stages: **Resonance Contamination**, **Resonance Scar**, and **Silent Structure**. A family has at most one visible state per planet; feature states cannot be manually cleared; state changes replace the prior state; each state has real economic effects appropriate to empire class. Stage II reuses this foundation rather than creating a competing representation.
- Show resource changes in native option tooltips where the engine supports it. Localize all player-facing content in English and German. Use suitable Vanilla or original graphics.
- Treat save/load and multiplayer safety as release requirements. Distinguish design requirements, source evidence, static checks, and in-game verification; do not claim runtime success from static checks.

## Optional Gigastructures integration

EPOCH Core remains independently usable and contains no hard reference to Gigastructures identifiers or content. Integration belongs in a separately packaged optional compatibility mod. If Gigastructures or the compatibility mod is absent, Core must still load and function. Dependency metadata, launcher activation, package layout, and load order require validation; directory placement alone does not make a separately installable mod. See the evidence limits in [technical contract](technical-contract.md).
