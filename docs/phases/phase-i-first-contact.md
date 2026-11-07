# Stage I – First Contact

**Status: Binding specification.** Implemented; current in-game campaign evidence reaches entry to Stage II. This does not establish complete multiplayer, AI, or alternative-path validation. Engine-specific requirements and evidence are in the [technical contract](../technical-contract.md); acceptance is in [testing](../testing.md).

## Five sections

1. **First Echo.** Discovery follows actual science-ship exploration and is staggered by empire. Each empire owns its situation, projects, targets, choices, and outcomes. At least two approaches differ meaningfully in time, risk, or cost and affect later paths.
2. **Missing Expedition.** The player assigns an existing owned Science Ship and scientist to a destination Special Project. The success callback identifies the ship that performed it; only that ship is removed. Search and rescue use native projects or equivalent game mechanics and have conditional outcomes, including loss. Failure/cancellation can be retried or explicitly abandoned.
3. **First Contamination.** A real owned planet/object receives a native persistent gameplay state. Investigation, containment, neglect, and possible spread have consequential effects, varied by empire class and influenced by earlier outcomes.
4. **The Silent Structure.** Earlier clues lead to a located structure implemented as a real four-stage Archaeological Site with Science Ship/scientist requirements and archaeology callbacks. Investigation, securing, and destruction are distinct actions with persistent results.
5. **Phase-I Conclusion.** Summarize the actual outcomes of sections 1–4. The player continues or makes an in-world permanent exit choice. Exit blocks re-entry and later campaign dispatch for that empire. Consequences remain.

## Campaign requirements

The campaign is owned by the country and isolated per empire. Save choices and outcomes; guard transitions and make repeated callbacks harmless. Recheck eligibility, owner, current section, and permanent exit before dispatch. Never use a foreign empire's targets. When a ship, leader, system, planet, project, or archaeology site is unavailable, use a safe recovery route without deleting unrelated objects or leaving the player stuck.

Events communicate decisions and outcomes; real objects and player actions implement them. Every blocking choice has an AI-safe route with equivalent prerequisites and costs. Organic, Hive Mind, and Machine Intelligence empires share progression rules with suitable mechanics and text.

Each participating empire receives at least one permanent, proportionate, path-dependent negative gameplay consequence. It persists through save/load and is not an ordinary timed modifier. Conclusion text stays in-world and does not reveal internal campaign/opt-out state. Preserve uncertainty: Stage I does not reveal the system's origin, complete purpose, later stages, or UAP.

## Shared Planetary Features

Stage I and PR #11 established three families: **Resonance Contamination**, **Resonance Scar**, and **Silent Structure**. Each family has at most one visible state on a planet at once; a state cannot be manually cleared; transitions replace the previous state in that family. States have actual economic effects, with valid production effects for organic, Hive, and Machine empires. The state markers use native planet feature UI. Stage II uses this shared model and preserves Stage-I consequences.

Current feature states are: Contamination—active, worsened, studied, contained, latent, resonant, unstable, controlled; Scar—base scar, altered, healed; Silent Structure—unsecured, secured, investigated, destroyed. Keep these state meanings and economic effects stable while migrating the old Stage II event flow.
