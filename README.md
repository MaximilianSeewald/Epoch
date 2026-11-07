# EPOCH – A New Galactic Age

**Target:** Stellaris 4.5.3 · **Languages:** English and German · **Optional integration:** Gigastructural Engineering & More

EPOCH is a narrative-driven campaign for organic empires, Hive Minds, and Machine Intelligences. It begins through staggered discoveries and events, with no new origin, start civic, or free start bonus.

## Project status

The binding campaign architecture has four stages: **I – First Contact** (implemented and tested in game through entry to Stage II; PR #11 merged the shared planetary feature/UI foundation), **II – Resonance** (design contract: exactly five chapters; implementation is not authorized by this document), **III – Military Crisis**, and **IV – Ascension**. The current in-game test reached the Stage II entry point. It does not establish complete multiplayer, AI, or alternative-path validation. See the [roadmap](docs/roadmap.md), [architecture](docs/architecture.md), and [source hierarchy](docs/architecture/content-migration.md).

## Design invariants

- Preserve vanilla content; Gigastructures is optional and separately integrated.
- No new start origin, civics, or free start bonuses. Discovery is event-led, not technology-led.
- Support organic, Hive Mind, and Machine Intelligence empires independently.
- No galaxy-global single instance may block another empire's campaign.
- Validate target ownership and scope before using event targets.
- Use real projects, technologies, buildings, fleets, planet states, and costs. Calendar time alone does not equal gameplay progress.
- Make consequences meaningful without creating a campaign softlock; retain permanent voluntary exit.
- Require save/load and multiplayer safety, English/German localisation, and suitable vanilla or original art.
- Report static checks, source evidence, and in-game results as distinct evidence levels.

## Repository layout

- `common/`, `events/`, `scripts/`, `gfx/`, `localisation/` – current game content and code inventory.
- `compatibility/gigastructures/` – optional integration scaffold.
- `docs/` – binding design, technical references, historical evidence, and test plans.

The active content and migration decision register is [Content Migration](docs/architecture/content-migration.md). Gameplay code is not changed by the documentation consolidation.
