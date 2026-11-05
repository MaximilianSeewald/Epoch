# ADR-003: Schedule once and progress through keyed callbacks

- **Status:** Proposed; multiplayer and save/load validation open
- **Date:** 2026-11-06
- **Scope:** Discovery scheduling and event orchestration

## Context

EPOCH requires individually staggered entry, shared player/AI rules, and no
unnecessary global daily/monthly scans. M0-B source shows delayed country-event
patterns, but does not verify random delay syntax, synchronization, save/load,
or callback execution guarantees. M0-C's tester report does not specify those
cases.

## Decision

Persist a per-empire schedule generation/key and target before queuing at most
one delayed callback. Prefer a bounded deterministic offset using synchronized
inputs; use randomization only after multiplayer determinism is demonstrated.
Delivery revalidates the key, state, and eligibility. Later progression is
driven by explicit event, Situation, or Special Project outcomes. There is no
routine global or per-country eligibility poll.

## Consequences

- Work scales with country-start dispatches, eligible schedules, and active
  progression callbacks rather than repeated global checks.
- Missing callbacks require an explicit verified recovery path; blindly
  requeueing after load is forbidden.
- Per-empire staggering remains a requirement, but its actual timing method is
  not selected as executable syntax in this ADR.
- Active Situation costs and large-empire schedule costs must be measured.

## Alternatives considered

- **Periodic global eligibility scan:** rejected by default due to recurring
  cost and additional synchronization/replay boundaries.
- **Simultaneous single global reveal:** rejected because it does not provide
  individually staggered discovery.
- **Unverified random delay:** rejected until draw synchronization and replay
  behavior are demonstrated in host/client testing.

## Evidence

M0-B verifies source patterns only for country hooks and delayed events. It
does not verify scheduling safety, determinism, persistence, or performance.
