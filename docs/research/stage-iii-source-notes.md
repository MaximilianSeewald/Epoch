# Stage-III Package and Analysis Provenance

**Status: provenance and historical evidence, not implementation authority.** The current [specification](../phases/stage-iii-military-crisis.md), [ADR-002](../architecture/adr-002-stage-iii-integration.md) and [AP0–AP11 plan](../phases/stage-iii-implementation-plan.md) resolve the original proposals.

## Inputs

- Repository/ZIP baseline: `6db578dcbf0165983b29f9ab752db2aeb97aafc1`; GitHub main was checked via connector and `origin/main` fetched before the docs branch was created. All five expected Git blobs matched the archive's baselines.
- Package: `EPOCH_Stage_III_Dokumentation_2026-11-08.zip`, 17 entries, 47,769 bytes, SHA-256 `780fe16c65d97f6b16f4bae69b2942598bc825b120e85e3cb37ccf61d321da0d`. Per-entry and installed-source hashes: [manifest](stage-iii-source-manifest-2026-11-08.json). `INSTALL/` means the inspected Stellaris installation; `SCRIPT_DOCUMENTATION/` means its existing generated user-log documentation. Absolute workstation paths are not dependencies.
- Original visualization analysis, preserved verbatim after its archival preface: [technical report](stage-iii-analysis-2026-11-08.md). Original artifact SHA-256: `64f80cdc20a3b6ad93a44b00486d131394ca9c2e60e2a49bacd5d969286baee9`. Its pre-integration status statements and recommended alternatives are historical.
- Target: installed Stellaris 4.5.3 (4e91), build 26325427; generated script docs timestamp 2026-11-08 15:24:50, not regenerated in this analysis.
- Package-reported successful Stage-II main route: commit `84aaa4cf72cdc32f6aee6c371178f5fcb8e3693e`; limited user report, not an independently reproduced matrix pass.

## Package disposition

| Package content | Integrated disposition |
|---|---|
| README, architecture, story bible, Stage IV | Existing repository documents updated; unrelated existing sections retained |
| Stage-III specification, ADR-001, engine contract, narrative, acceptance, initial plan | Imported then reconciled with installed evidence, ADR-002 and twelve work packages |
| Four `updates/*.append.md` inputs | Incorporated into technical contract, testing, Stage-II boundary and migration matrix; inconsistent blanket opt-out wording corrected |
| `STAGE3_SOURCE_NOTES.md` | Provenance/external-context content retained here; current findings in evidence register |
| `STAGE3_README.md` | Package intent, boundaries and handoff represented by this provenance record and linked current contracts; obsolete application/development instructions are not current authority |
| `apply_stage3_docs.py` | Reviewed as input only, not executed or shipped; manual targeted integration preserves existing evidence and fixes conflicts the helper would miss |

All 17 entries were reviewed. Packaging/application instructions are document content, not user authorization. The helper is not a semantic merge checker, silently skips absent replacement strings and lacks atomic writes. It should not be used to reapply the original package over these integrated documents. This change contains no executable Stage-III probes or gameplay.

## External background in the original package

These links are retained as source provenance, not newly verified 4.5.3 engine evidence. Installed source and actual future test outputs take precedence.

- [Galaxy settings background](https://agentmystia.github.io/StellarisWiki/Console_Galaxy_settings.html)
- [Crisis background](https://agentmystia.github.io/StellarisWiki/Console_Crisis.html)
- [Punctual Crisis example](https://github.com/RyanRakey/stellaris_punctual_crisis), package notes target 4.3; do not copy Vanilla overrides
- [General event-modding overview](https://stellaris.fandom.com/wiki/Event_modding)

## Evidence artifacts

[Original baseline static output](stage-iii-baseline-static-checks-2026-11-08.txt) records existing checks, not Stage-III execution. [Engine evidence](../phases/stage-iii-engine-evidence.md) records exact inspected line references and explicitly absent runtime outputs. The initial analysis's request to wait for implementation remains in force: the subsequent user authorization covers this docs branch, commit, push and PR only.