# Stage II Development Plan

**Status: Replaced.** The old Block A/B/C sequence depended on the superseded eight-chapter Stage II and is not an active plan. No gameplay implementation is included in this documentation consolidation.

The next code PR should start from the technical checklist and migration table in [Content Migration](../architecture/content-migration.md), then implement and review against the five chapter contracts in [Stage II – Resonance](phase-ii-resonance.md). Split the work into independently reviewable increments only after dependencies and safe integration boundaries are mapped. The number and names of those increments are open; old block names do not imply chapter or release boundaries.

Stage I and the PR #11 feature foundation must remain functional throughout. Stage II must be empire-local, save/load-safe, and recoverable. Do not remove or rename live code until references, callback IDs, projects, effects, flags, and old prototype saves have a migration plan.
