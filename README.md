# EPOCH – A New Galactic Age

**Target:** Stellaris 4.5.3  
**Distribution:** Steam Workshop  
**Languages:** English and German  
**Optional integration:** Gigastructural Engineering & More

EPOCH is a narrative-driven, multi-stage development framework for organic empires,
Hive Minds, and Machine Intelligences. It begins through staggered discoveries and
event-driven story progression—not through a starting civic, trait, origin, bonus,
or technology.

## Project status

This repository scaffold is the initial project baseline. The lore in `docs/story-bible.md`
is a working proposal (v0.1), not locked canon. No in-game implementation is claimed
to be complete or tested yet.

## Design invariants

- Preserve vanilla content and gameplay.
- Add no starting civics, traits, origins, or start bonuses.
- Support organic empires, Hive Minds, and Machine Intelligences.
- Begin through individually staggered discovery events.
- Keep the early experience challenging but manageable.
- Reveal the larger purpose gradually.
- Prefer event-driven progression over frequent empire-wide polling.
- Give AI empires access to the same mechanics and prerequisites.
- Keep Gigastructures support in an optional compatibility bridge.
- Provide English and German localisation.

## Layout

- `common/` – scripted definitions, technologies, situations, projects and decisions.
- `events/` – narrative event files, grouped by story arc.
- `localisation/english/` and `localisation/german/` – localisation.
- `compatibility/gigastructures/` – optional integration layer.
- `docs/` – design, architecture, testing and release documentation.

The exact Stellaris file conventions and supported script scopes will be verified
against the 4.5.3 game files before implementation. This scaffold intentionally
does not include speculative gameplay scripts.
