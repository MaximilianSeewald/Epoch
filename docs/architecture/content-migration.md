# Content Migration and Documentation Authority

**Status: Stage-II code replacement completed; runtime acceptance open.** Current architecture and stage specs govern behavior; Git history is the archive. This register describes the actual replacement, not future instructions.

| Content | Implemented disposition |
|---|---|
| Old eight-chapter/19-stage Resonance progression | Replaced by five zero-monthly-progress stages, driven solely by actual objective callbacks/actions. |
| Old Phase-II event file | Reduced to guarded invitation recovery, schema detection and explicit prototype-save suspension. Fresh gameplay uses `epoch_res.*`; Stage I retains its existing clock call. |
| Block C, second crisis, Chamber projects, Countermark and four-ending dispatch | Active gameplay removed. `epoch_phase_ii_block_c_events.txt` deleted. No old Chapter-6–8 dispatch remains. |
| Old scheduled event IDs | Separate inert receivers preserve queued-save ID resolution. Correct original event types are retained. They contain no effects, options, dispatch, rewards or spawns. |
| Thirteen old project keys / Chamber recovery type | Abort-only project definitions and an inert zero-progress situation shell permit safe cleanup. No active code enables or starts them. The migration aborts old projects and destroys obsolete situations. |
| First Nullwarden fleet | Rebuilt with non-neutral targeted hostility, native tactical aggro, bounded once-only scale and native military destruction proof. Missing fleet targets never imply victory. One explicit paid replacement encounter is bounded and requires a new battle. |
| Old retreat/diversion helpers, stability counter, old completion/handoff helpers | Removed. No alternative successful Chapter-2 completion. Preparation remains optional support for actual combat. |
| PR #11 Contamination, Scar and Silent Structure | Shared cleaners/setters retained. New planet decisions use planet-local setters through the existing contamination cleaner, preserving independent families and Stage-I penalty flags. Added intrinsic organic/Hive/Machine economics for the four Stage-II states. |
| Prototype technologies/buildings/components | Two early research technologies and two buildings retained/reworked. Armor/Sensors/Field Control technology paths and component set/templates removed. Their future Stage-III/IV design remains open. |
| Legacy economic consequences | Definitions and associated localization retained for prototype saves, with no new active writer. No bulk removal of permanent costs. |
| Localization/GFX | New English/German story/project/decision/report keys; unused prototype names/keys removed. Vanilla event art, feature icons and ship graphics reused. |
| Prototype Block A/B/C/model tests | Removed. Replaced by source-derived five-chapter contract/interpreter tests. Stage-I flow and shared-family/event-structure tests retained; stale documentation wording assertions updated to PR #12's active contract. |

Before removal, an internal ledger inventoried 697 identifiers across scripts, callbacks, flags, targets, technology, buildings and localization, with incoming/outgoing file/line references. It is an implementation artifact outside the repository, not an additional architecture document. Current tests validate defined event/project/helper references and inert legacy receivers.

## Supported saves

New games and Stage-I/pre-entry saves retain the Stage-I foundation and continuation clock. A pre-entry save with a saved timer retains its deadline; an older save without a recorded date receives a conservative full interval at migration. New Stage II uses a separate persistent schema and guarded objectives. Prototype Stage-II saves enter an explicit incompatible/suspended state; there is no fabricated successful migration or Stage-III handoff. Old fleet references are de-escalated owner-locally, queued callbacks do nothing, and old consequences remain.

## Remaining work

Perform the connected gameplay run in [testing](../testing.md), particularly native death-hook attribution, AI science/decision behavior, return-point fleet containment, save loading of retired situations, lost targets, simultaneous empires and host/client MP. Verify new logs. Source patterns and static interpreters cannot certify engine behavior or balance. Stage-III/IV implementations and optional Gigastructures package validation remain separate work.
