# Technical architecture

This document records the proposed EPOCH design. It is not a claim that the
proposed systems or syntax have been tested in Stellaris 4.5.3. See
[`technical-reference.md`](technical-reference.md) for verification status and
the engine research gate.

## Principles

1. **Core first:** EPOCH Core is an independently installable Workshop mod and
   must work without Gigastructures.
2. **Separate compatibility submod:** EPOCH Gigastructures Compatibility is a
   distinct optional Workshop submod with its own descriptor and package root.
   It may depend on EPOCH Core and Gigastructures. Core must never require
   Gigastructures or contain hard references to its content.
3. **Event-led progression:** discovery begins through events. Prefer one-time,
   scoped scheduling and follow-up events over frequent global polling.
4. **Shared eligibility and rules:** organic empires, Hive Minds, and Machine
   Intelligences follow the same gates and progression rules. Narrative and
   consequences may account for their differences.
5. **AI parity:** AI empires receive the same eligibility checks and progression
   opportunities as player empires; AI weights and automation are design
   requirements pending engine verification.
6. **Staggered experience:** each eligible empire receives an individually
   delayed discovery in a common early-game window, rather than a simultaneous
   galaxy-wide reveal.
7. **Gradual reveal:** early content presents a local mystery and manageable
   challenge. It does not reveal the final ascension or its purpose.
8. **Localisation:** player-facing text is supplied in English and German.

## Proposed repository and Workshop packaging layout

The repository root is the EPOCH Core mod source/package root. Its internal
`descriptor.mod` and Core content directories are packaged and published as the
independently installable **EPOCH Core** Workshop mod.

The optional integration is a separate mod source/package root within the
repository, not an activation layer inside Core:

```text
Epoch/                                  # repository; also EPOCH Core source root
  descriptor.mod                       # Core internal descriptor
  common/
  events/
  gfx/
  localisation/
  docs/
  submods/
    EPOCH_Gigastructures_Compatibility/ # separate submod source/package root
      descriptor.mod                   # submod internal descriptor
      common/
      events/
      gfx/
      localisation/
```

The compatibility submod is packaged and published as its own Workshop item.
Its descriptor/package metadata may declare dependencies on EPOCH Core and
Gigastructures, but exact dependency fields, launcher behavior, activation
requirements, and load ordering must be verified before implementation. Do not
infer that merely placing a directory under `submods/` makes it a separate,
installable, or active mod. Do not invent dependency syntax or promise automatic
activation.

External launcher `.mod` files, if required by the verified distribution
workflow, are packaging artifacts kept outside the Workshop source roots. Do not
place an external launcher descriptor in either source root without a documented
packaging reason. Core must remain loadable and functional when the compatibility
submod and Gigastructures are absent.

**Repository status:** the existing `compatibility/gigastructures/` directory is
a scaffold placeholder and is not itself an independently installable submod.
The layout above is the intended packaging architecture; moving/creating package
files is a later packaging task, not gameplay implementation in this PR.

## Proposed progression stages

| Stage | Working name | Approximate period |
|---|---|---:|
| I | The First Echo | 2203–2208 |
| II | The Contamination | 2207–2215 |
| III | The Pattern | 2215–2230 |
| IV | The Integration | 2230–2250 |
| V | The Convergence | Mid/late game |
| VI | The Ascension | Late game |

Dates are narrative targets, not engine-verified locks. The discovery framework
proposal describes timing and state transitions; implementation must be revised
if 4.5.3 verification requires a different mechanism.

## Discovery architecture (proposed)

M0-B source review found a country-local candidate: `on_game_start_country` in
the supplied `common/on_actions/00_on_actions.txt`, alongside the no-scope
`on_game_start` hook. M0-C added an isolated runtime probe and records a general
tester-reported runtime campaign, but no case-specific outcomes for hook merge,
country coverage, duplicate dispatch, save/load, or multiplayer. Those
properties remain unverified in the evidence record. See
[`evidence/m0-b-engine-verification.md`](evidence/m0-b-engine-verification.md)
and [`testing/m0-c-runtime-test.md`](testing/m0-c-runtime-test.md).

The complete proposed bootstrap, shared eligibility contract, save/load and
running-campaign policy, empire-level UAP state machine, module interfaces,
recovery cases, MP/performance requirements, and runtime gates are documented
in [`architecture/m0-d-core-bootstrap-uap.md`](architecture/m0-d-core-bootstrap-uap.md).
Related decisions are recorded in the
[`architecture/decisions/`](architecture/decisions/) ADRs. The compact design
here remains a summary: evaluate eligibility in the country context, persist a
duplicate guard before scheduling at most one delayed callback, recheck state
and eligibility at delivery, and use explicit outcomes for later progression.
Do not infer exact-once, random timing, persistence, or multiplayer safety from
the source examples or the general M0-C report.

No technology is used to initiate discovery. No starting civic, trait, origin, or
bonus is added. The late-game purpose remains hidden during early stages. The
periodic eligibility-pulse fallback is documented only in
[`discovery-framework.md`](discovery-framework.md) as an unverified alternative;
it is not part of the recommended design.

## Gigastructures boundary

EPOCH Core contains no hard references to Gigastructures identifiers, events,
megastructures, components, or localisation keys. All integration-specific
content belongs in the separately packaged **EPOCH Gigastructures Compatibility**
submod. That submod may reference documented Core interfaces and Gigastructures
content only after both sides, dependency metadata, package boundaries, and
activation behavior are verified.

If Gigastructures is absent, EPOCH Core must continue to work. The optional
submod's absence must not break Core. These are architectural requirements, not
verified engine behavior. Exact Workshop packaging, dependency declarations, and
activation/load-order behavior remain unverified pending 4.5.3 and launcher
documentation.

## Implementation gate

Before gameplay scripts are written, complete the runtime and missing-source
checks listed in [`evidence/m0-b-engine-verification.md`](evidence/m0-b-engine-verification.md).
M0-B has source-level evidence for on_actions, event chains, situations, special
projects, and selected script systems. The supplied dataset does not include
localisation, UI assets, script_values, inline-script definitions, full AI
definitions, or vanilla packaging metadata; runtime and multiplayer validation
remain open. Before gameplay scripts are written, inspect the Stellaris 4.5.3 installation and
verify: descriptor conventions; recognised script directories; event namespaces,
types, and registration; on_action definitions and load behavior; scopes and scope
transitions; triggers/effects; scripted triggers/effects; flags, variables, and
event targets; situations/stages; special projects; localisation encoding/key
syntax; AI weights/automation; and multiplayer determinism/performance. Record the
source file and a minimal in-game validation for each feature. Do not treat this
proposal or older community examples as proof of 4.5.3 support.

M0-D is documentation-only. No gameplay implementation is authorized by its
architecture artifacts, and historical M0-B/M0-C results are not rewritten.
