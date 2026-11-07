# ADR-001: Use a country-local start hook as the bootstrap candidate

**Status: Historical technical decision record.** Its engine-verification limits remain evidence; campaign scope follows [current architecture](../../architecture.md).

- **Status:** Proposed; runtime gate open
- **Date:** 2026-11-06
- **Scope:** EPOCH Core initialization

## Context

M0-B source inspection found `on_game_start_country` dispatching country
initialization events and day-delayed country-event examples. It also found a
no-scope global `on_game_start`. M0-C implemented a probe for the country hook,
but its general tester-reported success contains no case-specific result for
additive merge, coverage, or duplicate dispatch. None of these patterns proves
4.5.3 runtime behavior.

## Decision

Use `on_game_start_country` as the preferred candidate for a country-scoped
bootstrap. The handler validates context, checks one shared eligibility policy,
persists a duplicate guard and schedule record, then requests at most one
delayed callback. Delivery rechecks current state, schedule generation, and
eligibility. The runtime implementation gate requires proof that adding a
handler preserves Vanilla handlers.

## Consequences

- Avoids an explicit global empire enumeration and recurring eligibility scan.
- Makes player/AI and supported empire-class parity a shared policy concern.
- Hook merge, exact-once behavior, coverage, and callback persistence remain
  open validation requirements; failure of additive registration blocks this
  mechanism until another safe entry is validated.
- Does not automatically support existing campaigns; migration needs its own
  verified one-shot entry point.

## Alternatives considered

- **Global `on_game_start` plus country scan:** rejected because the source hook
  has no country scope and an all-country traversal is unnecessary if the
  per-country hook is reliable.
- **Periodic eligibility pulse:** rejected as the default because it adds
  repeated work and can be missed/duplicated across timing boundaries. Retain
  only as a future fallback if event-based recovery cannot be validated.
- **Technology or starting-content gate:** rejected because discovery is
  designed to begin without a technology, origin, civic, trait, or bonus.

## Evidence

See M0-B evidence matrix (hook and delayed-event rows) and M0-C runtime probe
record. Status is source-verified pattern plus unspecified general tester
report; no specific bootstrap property is runtime-verified in the record.
