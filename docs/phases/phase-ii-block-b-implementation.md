# Phase II Block B — Expansion implementation

Block B continues `epoch_resonance_protocol` from the saved `epoch_ii_handoff_ready` state. It preserves the existing approach and 0–100 resonance-stability variable; it does not create a second Phase II invitation or reset the Phase I contamination and capital-scar records. Chapter 7 is not implemented or started.

## Situation flow and durable outcomes

| Situation stage | Required player action / release flag | Stored result |
|---|---|---|
| Scar wakes (0–20) | Existing Block A | Existing chapter record |
| Scar report (20–30) | Existing Block A survey/report | `epoch_ii_ch1_resolved` |
| First Hunters (30–50) | Existing Block A military encounter | `epoch_ii_ch2_resolved`, combat/diversion/withdrawal details |
| Hunters resolution (50–60) | Existing Block A | `epoch_ii_ch2_resolved` |
| Broken Code (60–80) | Existing Block A analysis project | `epoch_ii_ch3_resolved` |
| Block A handoff (80–90) | Existing Block A result report | `epoch_ii_handoff_ready` |
| Chapter 4 research (90–100) | Situation progress advances through the research interval | Research threshold at 100; no decision is needed to start progress |
| Chapter 4 incidents (100–110) | Choose containment/observation/exploitation, then resolve the anomaly, coordination disruption, and breakthrough | `epoch_ii_ch4_resolved`, protocol, incident, and cost/result flags |
| Chapter 5 research (110–120) | Situation progress advances through the research interval | Research threshold at 120; action event opens at the next stage |
| Chapter 5 expedition (120–130) | Choose listening array/mobile/paired survey, then investigate two distinct accessible systems with staffed Science Ships; archive is an expensive alternative | `epoch_ii_two_real_systems_surveyed` or distinct complete/partial/archive-only data flags; each failed project gets one paid retry |
| Chapter 5 silence (130–140) | Choose to dispatch a staffed Science Ship or pay for the archive; with insufficient Energy, emergency recovery costs stability; then choose dark/repeat/broadcast | `epoch_ii_silent_system_dark`, `_repeated`, or `_broadcast`; broadcast sets `epoch_ii_network_exposed` |
| Chapter 6 research (140–150) | Situation progress advances through the research interval | Research threshold at 150; action options follow |
| Chapter 6 encounter (150–170) | Receive armor research option, inspect the force, then destroy it, finish a staffed trap/science project, or withdraw | `epoch_ii_ch6_resolved`, route-specific result, node state and convergence-data quality |

All stages share one monotonic Situation, so the Block A approach and stability survive the handoff. Situation progress stops at each unresolved action. The final Situation completion sets `epoch_ii_block_b_complete`; the player-facing report prepares `epoch_ii_handoff_block_c_ready` without creating Block C content.

## Planet mechanics and laboratory

Four visible deposits pair with durable planet modifiers: Latent / Echo Scar, Active / Resonant Scar, Unstable / Fractured Resonance, and Controlled / Bound Resonance. State changes remove only the prior Phase II state. They do not remove the Phase I deposits or permanent modifiers. Economic and stability effects range from modest research at Latent to stronger research with production/stability loss at Unstable; Controlled improves research, output, and stability.

The three Chapter 4 incidents have distinct response effects. The breakthrough offers a permanent local job-output sacrifice, paid security and recovery, or a high-risk research experiment. A further owned world receives resonance only through the explicit 500-energy transfer decision; no galaxy-wide spread runs automatically. If that world is not available, the option is disabled.

The Resonance Laboratory unlocks after Chapter 4, requires Contamination-Neutral Infrastructure, has a one-per-planet limit, a 600-mineral build cost, and 4 energy monthly upkeep. The Rare Crystal upkeep was removed to make it practical earlier in a campaign; construction and energy upkeep keep it an investment. Its triggered modifiers respond to each of the four saved world states; unstable operation gives the most research with a stability penalty. A second building, Containment Infrastructure, is unlocked by the new technology and offers Society research on any world with local resonance-sensitive effects.

Contamination-Neutral Infrastructure is a tier-two Society technology with a normal research cost. Chapter 4 choices add it as a research option without granting the technology. It improves Society research empire-wide and unlocks the two buildings. Its technology key can serve as the planned alternative prerequisite for Resonance Field Control in Block C; Block C itself is not implemented here. Phase-I permanent deposits and modifiers remain untouched.

## Expedition sites, research, and combat

The two node systems are selected at run time from distinct systems reachable by the empire. Each is a real galaxy-system Special Project requiring a Science Ship and scientist. The silent-site selector searches from the first node for a distinct reachable system containing a non-colonizable barren planet and runs its own staffed project there. The player sees a dispatch decision before the silent-site project begins. Archiving costs 500 Energy and yields less research. If Energy is below that threshold, an archive-only emergency path costs 20 stability and yields no research. Each failed project can be retried once for 200 Energy while its saved system remains accessible. Project callbacks record each completed site once; if one site fails, its completed partner remains recorded and the expedition status stays partial until the second site succeeds.

The silent-system result records the null boundary, old cancellation grooves, a one-heartbeat return matching the Phase I archive, and uncertainty about authorship. The three choices produce different stability, research, or exposure results. The result does not establish who made the grooves or why. Project dispatch runs in an idempotent country-scoped event after the visible choice.

Adaptive Resonance Armor and Phased Sensors are offered at the start of Chapter 5 in all three survey postures, leaving the full research interval before the final encounter. Adaptive Resonance Armor is a normal engineering research option; Phased Sensors is a normal physics research option with Resonance Spectroscopy and Sensors II prerequisites, and its component is usable in ship designs. Chapter 6 re-offers the armor as a fallback. Neither technology is granted for free.

Chapter 6 restores hostility toward only the campaign empire when reusing the Block-A Nullwarden country; a missing country gets a campaign-local replacement. The second fleet is assigned to that country, and saved spawn guards prevent duplicates. Fleet strength reflects the earlier battle, diversion/withdrawal, broadcast exposure, and low resonance stability. Adaptive armor reduces the alloy cost of the trap; Phased Sensors reduce the energy cost of the science response. The direct combat route uses the 4.5.3 `on_fleet_destroyed_victim` callback to match the destroyed fleet against the attacking empire's saved second-fleet target. Combat, trap, science, and withdrawal outcomes all pass through one country-scoped idempotent resolver that clears conflicting result flags and grants one reward set. A missing event target alone cannot award victory; a callback for a foreign fleet cannot resolve this campaign.

After a successful trap or science countermeasure, or withdrawal, the surviving fleet is de-escalated only toward this campaign empire and receives one evasive route order to a reachable system outside the encounter site. The shared Chapter 6 resolver calls a dedicated helper that handles missing fleet/system targets and checks the route on monthly callbacks without repeating movement orders. Combat records a destroyed force; the other routes record a neutralized or withdrawn force. They do not delete the surviving fleet.

## Test and runtime limits

The source-driven Block B regression exercises stage order and thresholds, research/action separation, release gates, approach modifiers, owner scopes, hostile reset after Block-A neutralization, missing enemy-country recovery, spawn idempotence, both/one-site expedition outcomes, partial-record preservation, low-resource archive paths, repeated callbacks, one-time Chapter 6 resolution, mutually exclusive results, and surviving-fleet retreat after each noncombat route. `test_epoch_regressions.ps1` runs this alongside Phase I and Block A regressions.

These checks do not parse scripts with the Stellaris engine or validate UI, actual project dispatch/pathfinding, fleet combat, save/load, multiplayer, or AI execution. No game was launched and no in-game test was performed. The installed 4.5.3 source was used to verify the destroyed-fleet callback scope and existing Situation, building, project, system-query, component, and ship-section patterns.
