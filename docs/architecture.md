# EPOCH Architecture

Implementation status, 2026-11-09: Stage III is merged into main (PR #15); the third connected player test was reported successful. The [final correction report](phases/stage-iii-third-playtest.md) distinguishes that playtest from subsequent static-only corrections and remaining runtime/MP limits. Stage-IV [Package A is implemented for connected acceptance](phases/stage-iv-package-a.md), with static evidence only. Its [approved design](phases/stage-iv-ascension.md), [remaining work packages](phases/stage-iv-work-packages.md) and [technical feasibility](phases/stage-iv-technical-feasibility.md) remain the baseline.

**Status: Binding.** This is the source of truth for campaign-wide rules. Stage details are defined once in the linked specifications; acceptance criteria are in [testing](testing.md), technical evidence and limits in [technical contract](technical-contract.md), and legacy code disposition in the [migration matrix](architecture/content-migration.md).

## Four stages

| Stage | Name | Contract |
|---|---|---|
| I | First Contact | Five country-local sections, implemented and with in-game experience reported. See [Stage I](phases/phase-i-first-contact.md). |
| II | Resonance | Exactly five country-local chapters, starting about five in-game years after Stage-I continuation. Main player route reported accepted; independent alternate/AI/MP cases remain unverified. See [Stage II](phases/phase-ii-resonance.md). |
| III | **The Nullwarden Convergence** | **Merged; third connected player test reported successful, with subsequent corrections statically checked.** A **single global military midgame crisis** affects all spacefaring empires, independent of earlier personal EPOCH history. Early preparation is restricted to qualified completed/continued Stage-II countries in the ~20 years before the **configured** Mid-Game Start Year; uninitiated empires suffer stronger real planetary effects. See [Stage III](phases/stage-iii-military-crisis.md) and [ADR-001](architecture/adr-001-galactic-crisis.md). |
| IV | Ascension | **Package A implemented, native acceptance pending.** Six personal chapters, earned healing, six prototypes, physical construction and a combat-gated personal key. [Evidence, adaptations and one test](phases/stage-iv-package-a.md). Full technology/class content remains in packages B/C under the [approved design](phases/stage-iv-ascension.md). One EPOCH mod. |

Stage II ends with Chapter 5 and its explicit continuation/refusal choice. **It does not start the Stage-III global outbreak.** The Resonance Chamber and Countermark are excluded from Stage II; their later use is undecided. No extra stages or chapters are implied by implementation substeps.

## Cross-stage rules

- Add no origin, start civic, or free starting bonus. Stage-I First Contact starts through discoveries/events, not a technology.
- Support organic empires, Hive Minds, and Machine Intelligences with class-appropriate effects and text. **Stages I and II are owner-local**; each country retains its independent personal campaign, costs, targets, consequences, choice of permanent refusal and Stage-IV eligibility. No empire may read or consume another's private outcome.
- **Stage III intentionally adds one shared, galaxy-global crisis state.** The global threat exists and affects everyone even if no empire ever played Stage I/II. Its fleet/anchor outcomes are shared; private investigations, preparedness, rewards and personal future eligibility remain owner-local. This is the sole explicit exception to the previous 'no galaxy-global instance' principle; see [ADR-001](architecture/adr-001-galactic-crisis.md).
- Permanently declining the **personal EPOCH story** blocks further personal discoveries, early preparations, private mission chains and personal ascension. It does **not** immunize the empire from generic galactic crisis warnings, genuine enemy fleets, or physical planetary consequences during Stage III. No previous Stage-I/II opt-out flag may block universal global enrollment.
- Subject to validated safe placement and supported save initialization under ADR-002 I03/I04, Stage III starts roughly at the **configured Mid-Game Start Year** (default year is only illustrative), whether 0/1/many empires completed Stage II. Qualified countries can access real, optional preparation only from ~20 years before that setting **and** only after completing and explicitly continuing Stage II. Nonparticipants receive greater initial physical exposure, including suitable existing EPOCH planetary feature states.
- Validate ownership and scope before accessing event targets. Shared global objects need unique persistent canonical identity and safe cleanup, while per-empire records stay isolated. Never mutate unrelated foreign objects, fabricate a military win, or award a country's private research to another country.
- Use real ships, mobile hostile fleets, science projects, research, buildings, planetary states and costs. Events present decisions but do not substitute for promised gameplay. Time may pace content but cannot satisfy an objective by itself.
- Keep failure consequential but recoverable; all shared combat resolutions must be proven by real military/scientific objectives. Stage-III exposure must not be a scripted unavoidable instant game-over.
- Preserve Vanilla behavior. Stage I's three Planetary Feature families are shared across stages: **Resonance Contamination**, **Resonance Scar**, and **Silent Structure**. A family has at most one visible state per planet; states cannot be manually cleared; transitions replace their prior state; states have real economic effects appropriate to empire class. Stage III must not downgrade prior healed/controlled/contained/studied outcomes or change an active Stage-I/II objective to simulate exposure; use another conflict-free world or a proven supplementary crisis modifier (ADR-002 I01).
- Show actual resource changes and modifiers in native option tooltips where supported. Localize all player-facing content in English and German. Use suitable Vanilla or original graphics. No player-facing Stage names, mod/Handoff/internal flags or future spoilers.
- Treat save/load and multiplayer safety as release requirements. Distinguish design requirements, source verification, static checks, and real in-game evidence. Verify relative midgame clock, global coordinator, mobile fleet AI and shared planet/Colony behavior in installed Stellaris 4.5.3 before Stage-III gameplay claims.

The [integration policy ADR-002](architecture/adr-002-stage-iii-integration.md) resolves protected and active planetary objectives, save initialization, safe placement, authoritative state, version-1 military scope and shared resolution. Its rules apply together with the Stage-III specification. Historical research is evidence, not a competing contract. Gameplay and executable probes still require separate user authorization.

## Implementation authority

- [Stage-III specification](phases/stage-iii-military-crisis.md): binding requirements and crisis resolution.
- [Global-crisis ADR](architecture/adr-001-galactic-crisis.md): explicit change from country-only to shared global threat.
- [Stage-III engine contract](phases/stage-iii-engine-contract.md): source-proof gate.
- [Stage-III implementation plan](phases/stage-iii-implementation-plan.md): Codex work sequence.
- [Stage-III narrative outline](phases/stage-iii-narrative-outline.md): story pacing and knowledge boundary.
- [Stage-III acceptance](phases/stage-iii-acceptance.md): runtime and regression checks.

## Optional Gigastructures integration

EPOCH Core remains independently usable and contains no hard reference to Gigastructures identifiers or content. Integration belongs in a separately packaged optional compatibility mod. If Gigastructures or the compatibility mod is absent, Core must still load and function. Dependency metadata, launcher activation, package layout, and load order require validation; directory placement alone does not make a separately installable mod. Additional crisis strength or ships specifically for Gigastructures must not silently alter Core's Vanilla balance. See the evidence limits in [technical contract](technical-contract.md).
