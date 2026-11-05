# Technical architecture

## Principles

1. **Core first:** EPOCH Core must run without Gigastructures.
2. **Optional bridge:** Gigastructures-specific references stay isolated under
   `compatibility/gigastructures/` and are guarded by verified compatibility checks.
3. **Event-driven progression:** use on_actions and scoped events where appropriate;
   avoid unnecessary daily/monthly empire-wide scans.
4. **Shared progression, differentiated expression:** all empire classes use the
   Universal Ascension Protocol, while narrative options and effects can respect
   biological, hive and machine identities.
5. **AI parity:** AI uses the same unlock requirements and receives sensible weights
   and safe automation where the engine supports it.
6. **Localisation discipline:** every player-facing string has English and German keys.

## Proposed progression stages

| Stage | Working name | Approximate period |
|---|---|---:|
| I | The First Echo | 2203–2208 |
| II | The Contamination | 2207–2215 |
| III | The Pattern | 2215–2230 |
| IV | The Integration | 2230–2250 |
| V | The Convergence | Mid/late game |
| VI | The Ascension | Late game |

Dates are guidance, not hard locks. Entry timing should be staggered and influenced
by game state and prior choices.

## Implementation gate

Before writing gameplay scripts, verify Stellaris 4.5.3 conventions for:
- mod descriptor and directory structure;
- event namespaces, event triggers and scopes;
- on_action definitions and load order;
- situations and situation stages;
- special projects and archaeology/anomaly hooks where relevant;
- scripted triggers/effects and supported conditionals;
- localisation encoding and key syntax;
- AI weights and multiplayer-safe behaviour.

Do not assume that proposed folder names correspond to engine-recognised folders.
Use only verified game conventions in the implementation.
