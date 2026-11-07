# ADR-004: Keep Gigastructures integration outside Core

**Status: Historical technical decision record.** The optional integration boundary remains a current invariant where summarized in [architecture](../../architecture.md); packaging details remain subject to verification.

- **Status:** Accepted as an architecture requirement; packaging validation open
- **Date:** 2026-11-06
- **Scope:** EPOCH distribution and module boundaries

## Context

EPOCH Core must be independently installable. Existing architecture documentation
already establishes a separate optional compatibility submod. M0-B did not
include launcher metadata or establish descriptor, activation, or load-order
behavior.

## Decision

Core owns generic bootstrap and UAP contracts only. A separately packaged,
optional Gigastructures compatibility mod owns all Gigastructures identifiers,
content mapping, dependencies, and integration UI. Core must work unchanged
when the compatibility mod or Gigastructures is absent.

## Consequences

- Core has no hard references or required package dependency on Gigastructures.
- Integration changes can be released separately and target documented Core
  interfaces.
- Package layout, dependency metadata, activation, and load order remain
  implementation/release validation items.

## Alternatives considered

- **Direct Gigastructures references in Core:** rejected because it makes the
  optional mod mandatory or risks unresolved content references.
- **Conditional Gigastructures content mixed into Core:** rejected because it
  weakens package isolation and complicates independent support.

## Evidence

This is an EPOCH product architecture requirement, not a claim that launcher or
Workshop behavior has been verified. See M0-B packaging evidence and
[`../../architecture.md`](../../architecture.md).
